# Course Demo App Frontend

Very basic frontend to demonstrate the API.

What works:
* Logging in
* Getting Courses, Course Dates, Bookings
* Booking spots for a specific date

For dev login usernames / passwords see [Backend Readme](/README.md).

Some what modern browser is expected (Edge >= 16, Chrome >= 51, FF >= 60)

## Setup
* npm i
* For e2e tests, cypress needs xvfb installed, see https://docs.cypress.io/guides/guides/continuous-integration.html#Dependencies

You probably only need xvfb for headless tests, but these are the install commands listed on the website:
* For Ubuntu/Debian: `apt-get install libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 libxtst6 xauth xvfb`
* For CentOS: `yum install -y xorg-x11-server-Xvfb gtk2-devel gtk3-devel libnotify-devel GConf2 nss libXScrnSaver alsa-lib`

## Tests
### Unittests
The are not that many unit tests implemented, to run the one that is, run

`npm run test:unit`

### E2E
You have two options, in browser or headless:

* In Browser: `npm run test:e2e`
* Headless: `npm run test:e2e:headless`
* Headless against existing webpack dev server: `npm run test:e2e:headless:dev`

The first two will start a seperate webpack dev server for testing, so the backend has to be running.
The third expects the frontend to already be running at localhost port 8080.

## What is missing?
* Running the frontend using a self signed cert for the samesite cookie attribute to work correctly in dev & during e2e tests
* Unit tests...

## Screenshots of the monstrosity

### Landing page

![Landing page](/web/doc/LandingPage.jpeg)

### Login screen

![Login screen](/web/doc/LoginScreen.jpeg)

### Courses overview

![Courses overview](/web/doc/Courses.jpeg)

### Course "detail" view

![Course detail view](/web/doc/CourseView.jpeg)

### Course dates & booking

![Course dates and booking](/web/doc/BookingCourseDates.jpeg)


