describe('header', () => {
    describe('login button', () => {
        it('should be visible if not logged in', () => {
            cy.visit('/');
            cy.get('header #login-link').should('exist').should('contain.text', 'Login');
        });

        it('should link to login site if not logged in', () => {
            cy.visit('/');
            cy.get('header #login-link').click();
            cy.hash().should('equal', '#/login');
        });

        it('should not contain a login button if logged in', () => {
            cy.login();
            cy.get('header #login-link').should('not.exist');
        });
    });

    it('should contain the name of the current route', () => {
        cy.visit('/#courses');
        cy.get('header #title').should('exist').should('contain.text', 'Kurse');
    });

    describe('left links container', () => {
        it('should contain links to courses and bookings if logged in', () => {
            cy.login();
            const headerLinksContainer = cy.get('header #links');
            headerLinksContainer.get('#courses-link').should('exist').should('have.attr', 'href', '#/courses');
            headerLinksContainer.get('#bookings-link').should('exist').should('have.attr', 'href', '#/booked');
        });
        it('should contain a link to courses if not logged in', () => {
            cy.visit('/');
            const headerLinksContainer = cy.get('header #links');
            headerLinksContainer.get('#courses-link').should('exist').should('have.attr', 'href', '#/courses');
            headerLinksContainer.get('#bookings-link').should('not.exist');
        });
    });
});
