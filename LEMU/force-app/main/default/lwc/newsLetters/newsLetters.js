// newsLettes.js
import {LightningElement, track, wire, api} from 'lwc';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import {updateRecord} from 'lightning/uiRecordApi';
import {refreshApex} from '@salesforce/apex';
import {getRecord, getFieldValue} from 'lightning/uiRecordApi';
import DOUBLE_OPT_IN_STATUS from '@salesforce/schema/Contact.double_opt_in_status__c';
import DOUBLE_OPT_IN_TIMESTAMP from '@salesforce/schema/Contact.double_opt_in_timestamp__c';
import MC_UNSUBSCRIBED_TIMESTAMP from '@salesforce/schema/Contact.mc_unsubscribed_timestamp__c';
import HAS_OPTED_OUT_OF_EMAIL from '@salesforce/schema/Contact.HasOptedOutOfEmail';
import NEWSLETTERS from '@salesforce/schema/Contact.udsendelse_nyhedsbreve__c';
import ID_FIELD from '@salesforce/schema/Contact.Id';
import ConfirmResend from '@salesforce/label/c.Marketing_Confirm_Resend';
import ConfirmSubscribe from '@salesforce/label/c.Marketing_Confirm_Subscribe';
import ConfirmUnsubscribe from '@salesforce/label/c.Marketing_Confirm_Unsubscribe';
import WaitingForResponse from '@salesforce/label/c.Marketing_Waiting_For_Response';

export default class newsLetters extends LightningElement {
    disabled = false;
    @track error;

    @track clickedButtonLabel = '';
    @track confirmButtonLabel = '';
    @track confirmText = '';
    @api recordId;
    label = {
        ConfirmResend,
        ConfirmSubscribe,
        ConfirmUnsubscribe,
        WaitingForResponse
    };


    @wire(getRecord, {
        recordId: '$recordId',
        fields: [DOUBLE_OPT_IN_STATUS, DOUBLE_OPT_IN_TIMESTAMP, HAS_OPTED_OUT_OF_EMAIL, NEWSLETTERS, MC_UNSUBSCRIBED_TIMESTAMP]
    })
    loadRecord({error, data}) {
        // When loading the contact record, the current state in double_opt_in_status__c field is read.
        // Depending on what current state is, the button is configured to display different labels	
        if (data) {
            this.app = data;
            this.error = undefined;
            if ((this.app.fields.double_opt_in_status__c.value == "Afmeldt (ingen nyhedsbreve)" || this.app.fields.double_opt_in_status__c.value == null || this.app.fields.double_opt_in_status__c.value == '') && !this.app.fields.udsendelse_nyhedsbreve__c.value) {
                // Current state is either "Afmeldt (ingen nyhedsbreve)" or null/blank. This allow the user to press "Tilmeld nyhedsbrev"
                this.clickedButtonLabel = 'Tilmeld nyhedsbrev';
                this.confirmButtonLabel = 'Bekræft tilmelding';
                this.confirmText = this.label.ConfirmSubscribe;
                console.log('ConfirmSubscribe this.confirmText: ' + this.confirmText + " / " + this.label.ConfirmSubscribe);
            } else if (this.app.fields.double_opt_in_status__c.value == "Afventer (Sendt)") {
                // Current state is "Afventer (Sendt)". This change the label on the button to "Afventer"
                this.clickedButtonLabel = 'Afventer';
                this.confirmButtonLabel = 'OK';
                this.confirmText = this.label.WaitingForResponse;
                console.log('ConfirmResend this.confirmText: ' + this.confirmText + " / " + this.label.ConfirmSubscribe);
            } else if (this.app.fields.double_opt_in_status__c.value == "Afventer (Ikke svaret)") {
                // Current state is Afventer (Ikke svaret)". This change the label on the button to "Gensend tilmelding"
                this.clickedButtonLabel = 'Gensend tilmelding';
                this.confirmButtonLabel = 'Bekræft gensend';
                this.confirmText = this.label.ConfirmResend;
                console.log('ConfirmResend this.confirmText: ' + this.confirmText + " / " + this.label.ConfirmSubscribe);
            } else if (this.app.fields.double_opt_in_status__c.value == "Accepteret (modtager nyhedsbreve)" || this.app.fields.udsendelse_nyhedsbreve__c.value) {
                // Current state is "Accepteret (modtager nyhedsbreve)". This change the label on the button to "Frameld nyhedsbrev"
                this.clickedButtonLabel = 'Frameld nyhedsbrev';
                this.confirmButtonLabel = 'Bekræft framelding';
                this.confirmText = this.label.ConfirmUnsubscribe;
                console.log('ConfirmUnsubscribe this.confirmText: ' + this.confirmText + " / " + this.label.ConfirmSubscribe);
            }
            // for debugging
            console.log('this.clickedButtonLabel: ' + this.clickedButtonLabel);
            console.log('this.confirmText: ' + this.confirmText);
            console.log('this.confirmButtonLabel: ' + this.confirmButtonLabel);
            console.log('double_opt_in_status__c: ' + this.double_opt_in_status__c);
            console.log('this.app.fields.double_opt_in_status__c.value: ' + this.app.fields.double_opt_in_status__c.value);


        } else if (error) { 
            this.dispatchEvent(new ShowToastEvent({title: 'Error loading record', message: error.body.message, variant: 'error'}));
        }
    }

    @track openmodel = false;

    openmodal() {
        // Set the prompt box to open
        this.openmodel = true;

    }
    closeModal() {
        // Set the prompt box to close
        this.openmodel = false;
    }

    cancelMethod() {
        // Set the prompt box to close
        this.closeModal();
    }

    formatDate() {
        // formatDate is needed to convert the JS date format to the format used in Salesforce
        console.log('formatDate called');
        var d = new Date();

        var month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();

        if (month.length < 2) 
            month = '0' + month;
        if (day.length < 2) 
            day = '0' + day;
        return [year, month, day].join('-');
    }

    // When user press the "Confirm" button in the dialog box, the action is taken depending on the label on the button
    acceptNewsLetters(event) {
        var today = this.formatDate();
        const label = event.target.label;
        // Create the recordInput object
        const fields = {};
        fields[ID_FIELD.fieldApiName] = this.recordId;
        if (label === 'Bekræft tilmelding' || label === 'Bekræft gensend') {
            // When label is 'Bekræft tilmelding' or  'Bekræft gensend'  the field double_opt_in_status__c is set to 'Afventer (Sendt)' 
            // and double_opt_in_timestamp__c is set to today
            fields[DOUBLE_OPT_IN_STATUS.fieldApiName] = 'Afventer (Sendt)';
            fields[DOUBLE_OPT_IN_TIMESTAMP.fieldApiName] = today;
            this.clickedButtonLabel = 'Afventer';
        } else if (label === 'OK') {
            console.log('OK pressed'); 
        } else if (label === 'Bekræft framelding') {
            // When label is 'Bekræft framelding' the field double_opt_in_status__c is set to 'Afmeldt (ingen nyhedsbreve)' ,
            // mc_unsubscribed_timestamp__c is set to today, HasOptedOutOfEmail is set to true and udsendelse_nyhedsbreve__c is set to false
            fields[DOUBLE_OPT_IN_STATUS.fieldApiName] = 'Afmeldt (ingen nyhedsbreve)';
            fields[HAS_OPTED_OUT_OF_EMAIL.fieldApiName] = true;
            fields[NEWSLETTERS.fieldApiName] = false;
            fields[MC_UNSUBSCRIBED_TIMESTAMP.fieldApiName] = today;
            console.log('Frameldt MC_UNSUBSCRIBED_TIMESTAMP' );
            this.clickedButtonLabel = 'Tilmeld nyhedsbrev';
        }
        const recordInput = {
            fields
        };

        updateRecord(recordInput).then(() => {
            this.dispatchEvent(new ShowToastEvent({title: 'Success', message: 'Kontaktperson opdateret', variant: 'success'}));
            // Display fresh data in the form
            return refreshApex(this.contact);
        }).catch(error => {
            this.dispatchEvent(new ShowToastEvent({title: 'Error updating record', message: error.body.message, variant: 'error'}));
        });
        this.closeModal();
    }


}