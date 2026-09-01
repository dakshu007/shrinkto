describe("Visual Testing with Argos", () => {
  it("screenshot homepage", () => {
    cy.visit("/");
    cy.argosScreenshot("homepage");
  });
});
