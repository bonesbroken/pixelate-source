import $ from "jquery";
import { defaultPixelSettings, pixelateSource } from './utils.js';
import '@shoelace-style/shoelace/dist/themes/dark.css';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/range/range.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';
import '@shoelace-style/shoelace/dist/components/details/details.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';
setBasePath('./shoelace');

// streamlabs api variables
let streamlabs, streamlabsOBS;
let pixelateSettings = defaultPixelSettings;
let canAddSource = false;
let existingSource;

async function loadShoelaceElements() {
    await Promise.allSettled([
        customElements.whenDefined('sl-range'),
        customElements.whenDefined('sl-icon'),
        customElements.whenDefined('sl-select'),
        customElements.whenDefined('sl-details'),
        customElements.whenDefined('sl-range')
    ]);
}

$(function() {
    loadShoelaceElements();
    updateUI(pixelateSettings);
    pixelateSource(pixelateSettings); // Initial setup
    initApp();
});

async function initApp() {
    streamlabs = window.Streamlabs;
    streamlabs.init().then(async () => {
        //await loadUserSettings();

        streamlabsOBS = window.streamlabsOBS;
        streamlabsOBS.apiReady.then(() => {
            canAddSource = true;
        });

        streamlabsOBS.v1.App.onNavigation(nav => {

            if(nav.sourceId) {
                // Accesses via existing source, load source settings
                console.log('Accessed via existing source');

                streamlabsOBS.v1.Sources.getAppSourceSettings(nav.sourceId).then(settings => {
                    existingSource = nav.sourceId;

                    if(!settings) {
                        console.log('New source, no settings');
                        updateUI(pixelateSettings, 'existing');
                        
                    } else {
                        console.log('Gradient source, update from stored settings');
                        pixelateSettings = JSON.parse(settings);
                        updateUI(pixelateSettings, 'existing');
                        pixelateSource(pixelateSettings);
                    }
                });  
            } else {
                existingSource = null;
                // Accesses via side nav, load saved settings
                console.log('Accessed via side nav');
                updateUI(pixelateSettings, 'new');
                pixelateSource(pixelateSettings);
            }
        });
    });
}


function updateUI(settings, newSource) {
    if (!settings) return;

    $('#factor').attr('label', `Factor: ${Number(settings["factor"])}`);
    $('#factor').val(Number(settings["factor"]));

    if(newSource === 'new') {
        $('#saveAppSource').hide();
    } else {
        $('#saveAppSource').show();
    }
}

$('input.image-input').on('change', event => {
    let elem = $(event.target);
    let applyElem = elem.siblings('.apply-button');
    const validTypes = ['image/jpeg', 'image/png'];
    
    const selectedFile = event.target.files[0];
    if (selectedFile) {
        if (!validTypes.includes(selectedFile.type)) {
            showAlert('#generalAlert', 'Invalid file type.', 'Please select a JPG or PNG file.');
            elem[0].value = '';
            return;
        }

        if ((selectedFile.size / (1024 * 204)) > 10) {
            showAlert('#generalAlert', 'File size too large.', 'Please upload a file less than 10 MB.');
            elem[0].value = '';
            return;
        }
        $('#spinner').show();

        streamlabs.userSettings.addAssets([ { name: `${selectedFile.name}_${String(selectedFile.lastModified)}`, file: selectedFile } ]).then(result => {
            console.log(result);
            pixelateSettings.customImageUrl = result.customImage;
            pixelateSource(pixelateSettings);

            $('#spinner').hide();
        }).catch(error => {
            console.error('Error uploading asset:', error);
            $('#spinner').hide();
        });
    }
});

$(".image-upload").on('click', function(event) { 
    let elem = $(this);
    let inputElem = elem.closest('sl-details').children('input.image-input');
    inputElem.trigger('click');
});


// Map of field IDs to their display labels
const fieldLabels = {
    'factor': 'Factor'
};

$("sl-range").off('sl-change');
$("sl-range").on('sl-change', event => {
    const value = event.target && event.target.value;
    if (value === undefined) return;

    const numeric = Number(value);
    const fieldId = $(event.target).attr('id');
    const fieldLabel = fieldLabels[fieldId] || fieldId; // fallback to ID if no label found
    $(event.target).attr('label', `${fieldLabel}: ${numeric}`);
    pixelateSettings[fieldId] = numeric;
    pixelateSource(pixelateSettings);
});


$("#saveAppSource").on('click', () => { 
    if(!canAddSource) return;

    if(existingSource) {
        //streamlabsOBS.v1.Sources.updateSource({id: existingSource, name: title});
        streamlabsOBS.v1.Sources.setAppSourceSettings(existingSource, JSON.stringify(pixelateSettings));
        streamlabsOBS.v1.App.navigate('Editor');
        existingSource = null;
    }
});


$("#addAppSource").on('click', () => { 
    if(!canAddSource) return;
    streamlabsOBS.v1.Scenes.getActiveScene().then(scene => {
        streamlabsOBS.v1.Sources.createAppSource('Pixelate Source', 'pixelate-source').then(source => {
            streamlabsOBS.v1.Sources.setAppSourceSettings(source.id, JSON.stringify(pixelateSettings));
            streamlabsOBS.v1.Scenes.createSceneItem(scene.id, source.id);
            streamlabsOBS.v1.App.navigate('Editor');
        });
    });
});

function showAlert(element, title, content) {
    $(element)[0].show();
    $(element).find('.alert-title').text(title);
    $(element).find('.alert-content').text(content);
}