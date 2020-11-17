# API Design
The API should follow the basics of RESTful API design, and also be easily discoverable / testable.

For an early sketch of the API see [Apidesign_201113_201407.pdf](Apidesign_201113_201407.pdf)

## The API itself
### Paths, Resources, Collections
Related resources, like the dates a course is held at, should be reachable via a simple path showing their relation.
This also simplifies querying for resources in the backend.

Collections should be identifiable via their path, so "courses" to denote more than one course,
but a hypothetical single lecturer of a course would be available at /courses/:id/lecturer

Collections can map to services, but not necessarily have to. This gives a good first starting point when choosing where to implement logic.

The API should not be too fine. In particular for resources that will have to be accessible via an "overview" screen, 
having to collect them via all multiple calls is not desirable, so those should have their own (toplevel) collections. 
This saves us from doing multiple calls that might end up delaying rendering the information in the frontend and 
simplifies querying in the frontend (but not the backend).
An example is the bookings of courses, as the user might want an overview over all his bookings.

As much logic as possible should be kept server-side, so that a client does not need to do too 
much work to be able to utilise the information (or make too many additional REST calls).
This also enables the API to be more easily used by more than one client and even generic ones that might use the OpenAPI definitions.

### HTTP Verbs
The correct HTTP verbs should be used to trigger actions and access resources, this saves us from having to do user validation on resources that are users are free to access, but have to be logged in to change/create

Calls that change information, like PUT, POST, DELETE, etc. should only be possible for the authorized and identified user/owner of the resource.

### Errors / Return codes
Finally, return codes/errors should be able to stand on their own to denote what error/success occurred,
but not give too much information about the inner workings of the API away.
Ideally this means we do not return any body on these answers.

An example is a login function, we probably do not need to send additional information on a failed login, just 401, 400 should suffice.

## Documentation
To enable easy integration and testing, the API should describe / document itself. 
It should do so using the OpenAPI 3.0 specifications, but implementing a hypermedia API using HAL or similar methods would work as well.

Since writing and maintaining additional artifacts after the fact can lead to errors, this documentation should be a direct or indirect automatic result of the build process. 

The API should also give users a simple way to access the documentation using Swagger UI.
