const API_URL = "http://localhost:3000/api";
const TOKEN = "efrei_super_pass";

const products = [
  { name: "Smartphone Galaxy S21", price: 899, description: "Dernier smartphone Samsung avec appareil photo 108MP", stock: 15 },
  { name: "MacBook Pro M1", price: 1299, description: "Ordinateur portable Apple avec puce M1", stock: 10 },
  { name: "PS5", price: 499, description: "Console de jeu dernière génération", stock: 5 },
  { name: "Écouteurs AirPods Pro", price: 249, description: "Écouteurs sans fil avec réduction de bruit", stock: 20 },
  { name: "Nintendo Switch", price: 299, description: "Console de jeu portable", stock: 12 },
  { name: "iPad Air", price: 599, description: "Tablette Apple avec écran Retina", stock: 8 },
  { name: "Montre connectée", price: 199, description: "Montre intelligente avec suivi d'activité", stock: 25 },
  { name: "Enceinte Bluetooth", price: 79, description: "Enceinte portable waterproof", stock: 30 }
];

async function main() {
  console.log("Attente du service product...");
  await new Promise((r) => setTimeout(r, 10000));

  console.log("Création des produits...");

  for (const product of products) {
    const res = await fetch(`${API_URL}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TOKEN}`
      },
      body: JSON.stringify(product)
    });

    const text = await res.text();
    console.log(res.status, text);
  }

  console.log("Initialisation des produits terminée !");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});