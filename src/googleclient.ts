'use strict';

var google = require('googleapis');
var languageScopes = ['https://www.googleapis.com/auth/cloud-platform'];

let authClient = null;
let languageService = null;

export function authorizeGoogle() {
    google.auth.getApplicationDefault(function (err, auth) {
        console.log(err);
        // Depending on the environment that provides the default credentials
        // (e.g. Compute Engine, App Engine), the credentials retrieved may
        // require you to specify the scopes you need explicitly.
        if (auth.createScopedRequired && auth.createScopedRequired()) {
            authClient = auth.createScoped(languageScopes);
        }

        google.discoverAPI({
            url: 'https://language.googleapis.com/$discovery/rest',
            version: 'v1beta1',
            auth: authClient
        }, function (err, languageService) {
            languageService = languageService;
        });
    });

}

export function decorateSyntax(text:string) {
    languageService.documents.annotateText(
        {
            auth: authClient,
            resource: { // Resource is used as the body for the API call.
                document: {
                    content: text,
                    type: 'PLAIN_TEXT'
                },
                features: {
                    extract_syntax: 'TRUE'
                },
                encoding_type: 'UTF16'
            }
        },
        function (err, result) {
            console.log(result);
            let a = 0;
        });
}