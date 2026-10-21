/// <reference types="cypress" />
import { faker } from '@faker-js/faker/locale/pt_BR';
import categoria from "../fixtures/categories.json";

// Base para Livro 100% Válido
const gerarLivroValido = () => {
     const numeroRandom = faker.number.int({ min: 1, max: 20 });
     return {
          title: faker.lorem.words(3).split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' '),
          author: faker.person.fullName(),
          description: faker.lorem.paragraph(),
          category: categoria[Math.floor(Math.random() * categoria.length)].name,
          isbn: faker.commerce.isbn(),
          editor: faker.company.name(),
          language: 'Português',
          publication_year: faker.date.between({ from: '2000-01-01', to: new Date() }).getFullYear(),
          pages: faker.number.int({ min: 70, max: 500 }),
          format: 'Físico',
          total_copies: numeroRandom,
          available_copies: numeroRandom
     };
};

// Removedor de um Campo do Body
const semCampo = (campo) => (livro) => {
     const copia = { ...livro };
     delete copia[campo];
     return copia;
};

// Alterador de um Campo do Body
const comCampo = (campo, valor) => (livro) => ({ ...livro, [campo]: valor });

// Cenários Inválidos: Para Cada "it" Individual no Relatório
const cenariosInvalidos = [
     { erro: 'Título Ausente', alterar: semCampo('title'), mensagemEsperada: '"title" is required' },
     { erro: 'Título Vazio', alterar: comCampo('title', ''), mensagemEsperada: '"title" is not allowed to be empty' },
     { erro: 'Título com Tipo Inválido (Número)', alterar: comCampo('title', 12345), mensagemEsperada: '"title" must be a string' },
     { erro: 'Autor Ausente', alterar: semCampo('author'), mensagemEsperada: '"author" is required' },
     { erro: 'Ano de Publicação no Futuro', alterar: comCampo('publication_year', 9999), mensagemEsperada: '"publication_year" must be less than or equal to 2026' },
     { erro: 'Ano de Publicação em Formato Texto', alterar: comCampo('publication_year', 'Dois Mil e Vinte'), mensagemEsperada: '"publication_year" must be a number' },
     { erro: 'Número de Páginas Negativo', alterar: comCampo('pages', -10), mensagemEsperada: '"pages" must be greater than or equal to 1' },
     { erro: 'Número de Páginas Igual a Zero', alterar: comCampo('pages', 0), mensagemEsperada: '"pages" must be greater than or equal to 1' },
     { erro: 'Formato Inválido', alterar: comCampo('format', 'Esférico'), mensagemEsperada: '"format" must be one of [Físico, Digital, Audiobook]' },
     { erro: 'Total de Cópias Negativo', alterar: comCampo('total_copies', -5), mensagemEsperada: '"total_copies" must be greater than or equal to 1' }
];

describe('Testes da Funcionalidade Catálogo de Livros', () => {

     let token
     beforeEach(() => {
          cy.geraToken('admin@biblioteca.com', 'admin123').then(tkn => {
               token = tkn
          })
     });

     it('GET - Deve Listar Livros com Filtros e Paginação', () => {
          cy.api({
               method: 'GET',
               url: 'books',
               headers: { 'Authorization': token },
               qs: {
                    page: 1,
                    limit: 10,
                    category: 'Ficção',
                    author: 'J.K. Rowling'
               }
          }).should(response => {
               expect(response.status).to.equal(200)
               expect(response.body.books).to.be.an('array')
          })
     });

     it('GET - Deve obter Detalhes de um Livro Específico por ID', () => {
          cy.api({
               method: 'GET',
               url: 'books/1',
               headers: { Authorization: token }
          }).should((response) => {
               expect(response.status).to.equal(200)

               const book = response.body.book

               expect(book).to.have.property('title')
               expect(book).to.have.property('author')
               expect(book).to.have.property('isbn')
               expect(book).to.have.property('editor')
               expect(book).to.have.property('category')
               expect(book).to.have.property('language')
               expect(book).to.have.property('format')
          });
     });

     // Teste Extra
     it.skip('GET - Deve obter Detalhes de um Livro Recém-Cadastrado por ID', () => {
          const novoLivro = gerarLivroValido();

          cy.api({
               method: 'POST',
               url: 'books',
               headers: { Authorization: token },
               body: novoLivro
          }).then((postResponse) => {
               expect(postResponse.status).to.equal(201);
               const livroId = postResponse.body.book.id;

               cy.api({
                    method: 'GET',
                    url: `books/${livroId}`,
                    headers: { Authorization: token }
               }).then((response) => {
                    expect(response.status).to.equal(200);

                    const book = response.body.book;

                    expect(book.id).to.equal(livroId);
                    expect(book.title).to.equal(novoLivro.title);
                    expect(book.author).to.equal(novoLivro.author);
                    expect(book.isbn).to.equal(novoLivro.isbn);
               });
          });
     });

     // Teste: Qual estava me desafiando, poderia ser considerado como uma boa prática?
     it.skip('GET - Deve obter Detalhes de um Livro Específico por ID Randômico', () => {
          cy.api({
               method: 'GET',
               url: 'books',
               qs: {
                    page: 1,
                    limit: 20
               },
               headers: { Authorization: token }
          }).then((listResponse) => {
               expect(listResponse.status).to.equal(200)

               const books = listResponse.body.books

               expect(books).to.be.an('array')
               expect(books.length).to.be.greaterThan(0)

               const randomIndex = Math.floor(Math.random() * books.length)
               const randomId = books[randomIndex].id

               cy.log(`ID Randômico Selecionado: ${randomId}`)

               cy.api({
                    method: 'GET',
                    url: `books/${randomId}`,
                    headers: { Authorization: token }
               }).should((response) => {
                    expect(response.status).to.equal(200)

                    const book = response.body.book

                    expect(book.id).to.equal(randomId)
                    expect(book).to.have.property('title')
                    expect(book).to.have.property('author')
                    expect(book).to.have.property('isbn')
                    expect(book).to.have.property('editor')
                    expect(book).to.have.property('category')
                    expect(book).to.have.property('language')
                    expect(book).to.have.property('format')
               })
          })
     });

     it('POST - Deve Cadastrar um Novo Livro com Sucesso', () => {
          const novoLivro = gerarLivroValido();

          cy.api({
               method: 'POST',
               url: 'books',
               headers: { Authorization: token },
               body: novoLivro
          }).then((response) => {
               expect(response.status).to.equal(201)

               const book = response.body.book

               expect(response.body.message).to.equal('Livro criado com sucesso.')
               expect(book).to.have.property('id')
               expect(book.title).to.equal(novoLivro.title)
               expect(book.author).to.equal(novoLivro.author)
               expect(book.category).to.equal(novoLivro.category)
               expect(book.isbn).to.equal(novoLivro.isbn)
               expect(book.total_copies).to.equal(novoLivro.total_copies)
               expect(book.available_copies).to.equal(novoLivro.available_copies)
          })
     })

     cenariosInvalidos.forEach(({ erro, alterar, mensagemEsperada }) => {
          it(`POST - Deve Rejeitar: ${erro}`, () => {
               cy.api({
                    method: 'POST',
                    url: 'books',
                    headers: { Authorization: token },
                    body: alterar(gerarLivroValido()),
                    failOnStatusCode: false
               }).then((response) => {
                    expect(response.status).to.equal(400);
                    expect(response.body.message).to.equal(mensagemEsperada);
               });
          });
     });

     it('PUT - Deve Atualizar um Livro Previamente Cadastrado', () => {
          const livroAtualizado = {
               title: 'Livro Atualizado',
               author: 'Autor Atualizado',
               description: 'Descrição Atualizada',
               category: 'Categoria Atualizada',
               editor: 'Editor Atualizado',
               language: 'Português',
               publication_year: 2023,
               pages: 300,
               format: 'Físico',
               total_copies: 10,
               available_copies: 5
          };

          cy.api({
               method: 'POST',
               url: 'books',
               headers: { Authorization: token },
               body: gerarLivroValido()
          }).then((response) => {
               expect(response.status).to.equal(201)
               const livroId = response.body.book.id;

               cy.api({
                    method: 'PUT',
                    url: `books/${livroId}`,
                    headers: { Authorization: token },
                    body: livroAtualizado
               }).then((putResponse) => {
                    const tituloAnterior = putResponse.body.title;
                    expect(putResponse.status).to.equal(200);
                    expect(putResponse.body.message).to.equal('Livro atualizado com sucesso.');
                    expect(putResponse.body.bookId).to.equal(livroId);
                    expect(putResponse.body.previousTitle.title).to.equal(tituloAnterior);

                    cy.api({
                         method: 'GET',
                         url: `books/${livroId}`,
                         headers: { Authorization: token }
                    }).then((getResponse) => {
                         expect(getResponse.status).to.equal(200);

                         const book = getResponse.body.book;

                         Object.entries(livroAtualizado).forEach(([campo, valor]) => {
                              expect(book[campo], campo).to.equal(valor);
                         });
                    });
               });
          });
     });

     it('DELETE - Deve Deletar um Livro Previamente Cadastrado', () => {
          cy.api({
               method: 'POST',
               url: 'books',
               headers: { Authorization: token },
               body: gerarLivroValido()
          }).then((response) => {
               expect(response.status).to.equal(201);

               const livroId = response.body.book.id;
               const tit = response.body.book.title;
               const aut = response.body.book.author;

               cy.api({
                    method: 'DELETE',
                    url: `books/${livroId}`,
                    headers: { Authorization: token },
               }).then((deleteResponse) => {
                    expect(deleteResponse.status).to.equal(200);
                    expect(deleteResponse.body.message).to.equal('Livro deletado com sucesso.');
                    expect(deleteResponse.body.deletedBook.id).to.equal(livroId);
                    expect(deleteResponse.body.deletedBook.title).to.equal(tit);
                    expect(deleteResponse.body.deletedBook.author).to.equal(aut);
               });
          });
     });
});