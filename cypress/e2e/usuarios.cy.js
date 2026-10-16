/// <reference types="cypress"/>

let token
beforeEach(() => {
    cy.geraToken('admin@biblioteca.com', 'admin123').then(tkn => {
        token = tkn
    })
});

describe('GET - Teste de API - Gestão de Usuários', () => {

    it('Deve listar usuários com sucesso', () => {
        cy.api({
            method: 'GET',
            url: 'users',
            headers: { 'Authorization': token }
        }).should(response => {
            expect(response.status).to.equal(200)
            expect(response.body.users).to.be.an('array')
        })
    });

    it('Deve validar propriedades de um usuário', () => {
        cy.api({
            method: 'GET',
            url: 'users',
            headers: { 'Authorization': token }
        }).should(response => {
            expect(response.status).to.equal(200)
            expect(response.body.users[0]).to.have.property('id')
            expect(response.body.users[0]).to.have.property('name')
            expect(response.body.users[0]).to.have.property('email')
        })
    });

    it('Deve listar um usuário com sucesso buscando por ID', () => {
        cy.api({
            method: 'GET',
            url: 'users/2',
            headers: { 'Authorization': token }
        }).should(response => {
            expect(response.status).to.equal(200)
            expect(response.body).to.have.property('id')
            expect(response.body).to.have.property('name')
            expect(response.body).to.have.property('email')
        })
    });

    it('Deve listar usuario com sucesso usando filtro - parametros', () => {
        cy.api({
            method: 'GET',
            url: 'users',
            headers: { 'Authorization': token },
            qs: {
                page: 1,
                limit: 20,
                search: 'Usuário'
            }
        }).should(response => {
            expect(response.status).to.equal(200)
        })

    });

});

describe('POST - Teste de API - Gestão de Usuários', () => {
    it('Deve cadastrar um usuário com sucesso', () => {
        let email = `fabio${Date.now()}@email.com`
        cy.api({
            method: 'POST',
            url: 'users',
            body: {
                "name": "Maria Santos",
                "email": email,
                "password": "senha123"
            }
        }).should(response => {
            expect(response.status).to.equal(201)
            expect(response.body.message).to.equal('Usuário criado com sucesso.')
        })
    });

    it('Deve validade um usuário cadastrado com email inválido', () => {
        cy.api({
            method: 'POST',
            url: 'users',
            body: {
                "name": "Maria Santos",
                "email": "fabio4email.com",
                "password": "senha123"
            },
            failOnStatusCode: false
        }).should(response => {
            expect(response.status).to.equal(400)
            expect(response.body.message).to.equal('Formato de email inválido.')
        })
    });
});

describe('PUT - Teste de API - Gestão de Usuários', () => {
    it('Deve atualizar um usuário com sucesso', () => {
        cy.api({
            method: 'PUT',
            url: 'users/10',
            headers: { 'Authorization': token },
            body: {
                name: "Fabio Araujo Alterado",
                email: "fabio.novo.alterado@email.com",
                password: "novaSenha123alterada"
            }
        }).should(response => {
            expect(response.status).to.equal(200)
            expect(response.body.message).to.equal('Usuário atualizado com sucesso.')
        })
    });

    it('Deve atualizar um usuário com sucesso - De forma dinâmica', () => {
        let email = `fabio${Date.now()}@email.com`
        cy.cadastrarUsuario('Fabio Silva', email, 'senha123').then(userId => {
            cy.api({
                method: 'PUT',
                url: 'users/' + userId,
                headers: { 'Authorization': token },
                body: {
                    name: "Fabio Araujo Alterado",
                    email: email,
                    password: "novaSenha123alterada"
                }
            }).should(response => {
                expect(response.status).to.equal(200)
                expect(response.body.message).to.equal('Usuário atualizado com sucesso.')
            })


        })
    });
});

describe('DELETE - Teste de API - Gestão de Usuários', () => {
    it.skip('Deve excluir um usuário com sucesso', () => {
        cy.api({
            method: 'DELETE',
            url: 'users/31',
            headers: { 'Authorization': token }
        }).should(response => {
            expect(response.status).to.equal(200)
            expect(response.body.message).to.equal('Usuário removido com sucesso.')
        })
    });

    it('Deve excluir um usuário com sucesso - De forma dinâmica', () => {
        cy.cadastrarUsuario('Fabio para deletar', 'email@deletar.com', 'senha123').then(userId => {
            cy.api({
                method: 'DELETE',
                url: `users/${userId}`,
                headers: { 'Authorization': token }
            }).should(response => {
                expect(response.status).to.equal(200)
                expect(response.body.message).to.equal('Usuário removido com sucesso.')
            })
        })
    });

});