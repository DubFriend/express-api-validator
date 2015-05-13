#Express API Validator

Express middleware to declaratively validate incoming requests.

`npm install express-api-validator`

```javascript
app.post('/save-user', requestValidator({
        body: {
            username: {
                validators: ['required', 'minimumLength:3']
            },
            address: {
            	properties: {
            		street: {
            			validators: ['required']
            		},
            		city: {
            			validators: ['required']
            		}
            	}
        	}
        },
        query: {
        	isAdmin: {
        		validators: ['required', 'enumerated:true,false']
        	}
    	},
    	params: {
    		id: {
    			validators: ['integer', 'minimum:0']
    		}
    	}
    }),
    function (req, res, next) {
        res.send('Request is well formed and validated.');
    }
);
```