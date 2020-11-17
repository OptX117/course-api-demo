# Next Steps (Security)
What would be the next steps after this?

## Frontend
Basic things to do to secure the application:

* For legacy browsers, implement CSRF-Token, since same site strict cookies do not work
* Only run the application via TLS 1.3
* Enable HSTS header when running under consistent public domain, to prevent phishing after a hijacking of the domain by a third party
* Disabling X-Frames via X-Frame-Options, so app does not get run embedded
 
## Backend

* Disable identification Header (x-powered-by, versions and similar) that might give an attacker information on the software running
* Rate-limiter to prevent bruteforce login attacks
* Additional user input sanitation
* Additional caching of information to prevent the application from intentionally or intentionally ddosing the database
* If a domain is known, add that to the openapi specification

## Infrastructure

* Separate the backend and frontend into different services
* Put up a load balancer or similar in front of the services
