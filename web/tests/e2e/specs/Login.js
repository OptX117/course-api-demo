// https://docs.cypress.io/api/introduction/api.html


describe('Login', () => {
    afterEach(() => {
        cy.clearCookies();
    })

    it('should be able to log in', () => {
        cy.visit('/#/login');
        const loginForm = cy.get('form');

        loginForm.get('input[type=text]#username').type('001');
        loginForm.get('input[type=password]#password').type('001');
        loginForm.get('button#login-btn').click();

        cy.hash().should('equal', '#/');
        cy.getCookie('jsession').should('exist');
    });

    it('should contain username and password field, as well as a login button', () => {
        cy.visit('/#/login');
        const loginForm = cy.get('form');
        cy.hash().should('equal', '#/login');

        loginForm.should('exist');

        loginForm.get('input[type=text]#username').should('exist');
        loginForm.get('input[type=password]#password').should('exist');
        loginForm.get('button#login-btn').should('exist').should('contain.text', 'Login');
    });

    it('should not get forwarded if already logged in', () => {
        cy.visit('/#/login');
        const loginForm = cy.get('form');

        loginForm.get('input[type=text]#username').type('001');
        loginForm.get('input[type=password]#password').type('001');
        loginForm.get('button#login-btn').click();

        cy.hash().should('equal', '#/');
        cy.visit('#/booked');
        cy.hash().should('equal', '#/booked');
    });

    it('should not succeed if wrong username and password are entered', () => {
        cy.visit('/#/login');
        const loginForm = cy.get('form');

        loginForm.get('input[type=text]#username').type('002');
        loginForm.get('input[type=password]#password').type('001');
        loginForm.get('button#login-btn').click();

        cy.hash().should('equal', '#/login');
        cy.visit('#/booked');
        cy.hash().should('equal', '#/login');
    });
});
