// lwcNewAccountOverride.js
import { LightningElement, wire, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { encodeDefaultFieldValues } from 'lightning/pageReferenceUtils';
import { getRecord } from 'lightning/uiRecordApi';
import { CurrentPageReference } from 'lightning/navigation';

const FIELDS = [
    'Churn_follow_up__c.Name',
    'Churn_follow_up__c.Account__c',
]; 

export default class LwcNewAccountOverride extends NavigationMixin(LightningElement) {
    @api recordId;

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    wireRec({ error, data }) {
        if (error) {
            this.error = error;
        } else if (data) {
            this.EventName = data.fields.Name.value;
            this.AccountId = data.fields.Account__c.value;
            console.log('Name: ' + data.fields.Name.value + ' Account: ' +  data.fields.Account__c.value  );
        }
    }

    @wire(CurrentPageReference)
    currentPageReference; 

    EventName = '';
    AccountId  = '';

    createEvent() {
        let pageRef = { 
            type: "standard__objectPage",
            attributes: {
                objectApiName: "Event",
                actionName: "new"
            },
            state: {
            }
        };
        const defaultFieldValues = {
            Subject: this.EventName , 
            WhatId: this.AccountId,
            Churn_Follow_Up__c: this.recordId
        };

        pageRef.state.defaultFieldValues = encodeDefaultFieldValues(defaultFieldValues);
        this[NavigationMixin.Navigate](pageRef);
        this.navigateToRecordViewPage();
    }  

    createLog() {
         

        let pageRef = { 
            type: "standard__objectPage",
            attributes: {
                objectApiName: "Task",
                actionName: "new"
            },
            state: {
            }
        };
        const defaultFieldValues = {
            Subject: this.EventName , 
            WhatId: this.AccountId,
            Churn_Follow_Up__c: this.recordId
        };
        pageRef.state.defaultFieldValues = encodeDefaultFieldValues(defaultFieldValues);
        this[NavigationMixin.Navigate](pageRef);
    }  

    navigateToRecordViewPage() {
        // View a custom object record.
        console.log('navigateToRecordViewPage');
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                recordId: this.recordId,
                objectApiName: 'Churn_follow_up__c',
                actionName: 'view'
            }
        });
    }

}