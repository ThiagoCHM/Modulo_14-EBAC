/// <reference types="cypress" />
import { faker } from '@faker-js/faker/locale/pt_BR';
import categoria from "../fixtures/categories.json";

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
          const palavraRandom = faker.lorem.words(3);
          const tituloLivro = palavraRandom.split(' ').map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1)).join(' ');
          const numeroRandom = faker.number.int({ min: 1, max: 20 });
          const indiceCategorias = Math.floor(Math.random() * categoria.length);
          const categoriaRandom = categoria[indiceCategorias].name;
          const novoLivro = {
               title: tituloLivro,
               author: faker.person.fullName(),
               description: faker.lorem.paragraph(),
               category: categoriaRandom,
               isbn: faker.commerce.isbn(),
               editor: faker.company.name(),
               language: 'Português',
               publication_year: faker.date.between({ from: '2000-01-01', to: new Date() }).getFullYear(),
               pages: faker.number.int({ min: 70, max: 500 }),
               format: 'Físico',
               total_copies: numeroRandom,
               available_copies: numeroRandom
          };

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

     it('POST - Não Deve Cadastrar Livro com Dados Inválidos (Mensagens de Erro Específicas)', () => {
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
          // Iteração sobre os Cenários Inválidos
          cenariosInvalidos.forEach(({ erro, alterar, mensagemEsperada }, index) => {
               const identificador = `[${index + 1}/${cenariosInvalidos.length}] ${erro}`;

               cy.api({
                    method: 'POST',
                    url: 'books',
                    headers: { Authorization: token },
                    body: alterar(gerarLivroValido()),
                    failOnStatusCode: false
               }).then((response) => {
                    expect(response.status, `${identificador} - Status Code`).to.equal(400);
                    expect(response.body.message, `${identificador} - Mensagem`).to.equal(mensagemEsperada);
               });
          });
     })

     it('PUT - Deve Atualizar um Livro Previamente Cadastrado', () => {
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

          cy.api({
               method: 'POST',
               url: 'books',
               headers: { Authorization: token },
               body: gerarLivroValido()
          }).then((response) => {
               expect(response.status).to.equal(201);
               const livroId = response.body.book.id;

               cy.api({
                    method: 'PUT',
                    url: `books/${livroId}`,
                    headers: { Authorization: token },
                    body: {
                         title: "Livro Atualizado",
                         author: "Autor Atualizado",
                         description: "Descrição Atualizada",
                         category: "Categoria Atualizada",
                         editor: "Editor Atualizado",
                         language: "Português",
                         publication_year: 2023,
                         pages: 300,
                         format: "Físico",
                         total_copies: 10,
                         available_copies: 5
                    }
               }).then((putResponse) => {
                    const tituloAnterior = putResponse.body.title;
                    expect(putResponse.status).to.equal(200);
                    expect(putResponse.body.message).to.equal('Livro atualizado com sucesso.')
                    expect(putResponse.body.bookId).to.equal(livroId);
                    expect(putResponse.body.previousTitle.title).to.equal(tituloAnterior);
               });
          });
     });


     it('DELETE - Deve Deletar um Livro Previamente Cadastrado', () => {
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
               }).then((putResponse) => {
                    expect(putResponse.status).to.equal(200);
                    expect(putResponse.body.message).to.equal('Livro deletado com sucesso.')
                    expect(putResponse.body.deletedBook.id).to.equal(livroId);
                    expect(putResponse.body.deletedBook.title).to.equal(tit);
                    expect(putResponse.body.deletedBook.author).to.equal(aut);
               });
          });
     });
});