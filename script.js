/* ==========================================================
   script.js – Gestionnaire de tâches

   SOMMAIRE
   1. État de l'application
   2. Références vers les éléments HTML
   3. Stockage (localStorage)
   4. Logique métier (ajouter, modifier, supprimer…)
   5. Affichage (rendu de la liste et du compteur)
   6. Événements
   7. Initialisation
   ========================================================== */

"use strict";


/* ---------- 1. ÉTAT DE L'APPLICATION ---------- */

const CLE_STOCKAGE = "gestionnaire-taches";

// Une tâche est un objet : { id: "…", titre: "…", terminee: false }
let taches = [];

// Filtre affiché : "toutes", "actives" ou "terminees"
let filtreActif = "toutes";


/* ---------- 2. RÉFÉRENCES VERS LE HTML ---------- */

const formulaire        = document.getElementById("formulaire");
const champTache        = document.getElementById("champ-tache");
const liste             = document.getElementById("liste");
const messageVide       = document.getElementById("message-vide");
const compteur          = document.getElementById("compteur");
const progression       = document.getElementById("progression");
const barreProgression  = document.getElementById("progression-barre");
const boutonVider       = document.getElementById("btn-vider");
const boutonsFiltre     = document.querySelectorAll(".filtre");


/* ---------- 3. STOCKAGE ---------- */

// Enregistre le tableau de tâches dans le navigateur
function sauvegarder() {
  try {
    localStorage.setItem(CLE_STOCKAGE, JSON.stringify(taches));
  } catch (erreur) {
    console.error("Sauvegarde impossible :", erreur);
  }
}

// Relit les tâches enregistrées (tableau vide si rien ou données invalides)
function charger() {
  try {
    const donnees = localStorage.getItem(CLE_STOCKAGE);
    taches = donnees ? JSON.parse(donnees) : [];
  } catch (erreur) {
    console.error("Lecture impossible :", erreur);
    taches = [];
  }
}


/* ---------- 4. LOGIQUE MÉTIER ---------- */

// Identifiant unique : date en millisecondes + nombre aléatoire
function genererId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function trouverTache(id) {
  return taches.find((tache) => tache.id === id);
}

function ajouterTache(texte) {
  const titre = texte.trim();
  if (titre === "") return;                       // on ignore les titres vides

  taches.push({ id: genererId(), titre: titre, terminee: false });
  mettreAJour();
}

function basculerTache(id) {
  const tache = trouverTache(id);
  if (!tache) return;

  tache.terminee = !tache.terminee;
  mettreAJour();
}

function modifierTache(id) {
  const tache = trouverTache(id);
  if (!tache) return;

  const nouveauTitre = prompt("Modifier la tâche :", tache.titre);
  if (nouveauTitre === null) return;              // l'utilisateur a annulé

  const titre = nouveauTitre.trim();
  if (titre === "") return;                       // on refuse un titre vide

  tache.titre = titre;
  mettreAJour();
}

function supprimerTache(id) {
  taches = taches.filter((tache) => tache.id !== id);
  mettreAJour();
}

function supprimerTerminees() {
  taches = taches.filter((tache) => !tache.terminee);
  mettreAJour();
}

// Renvoie les tâches correspondant au filtre actif
function tachesFiltrees() {
  if (filtreActif === "actives")   return taches.filter((t) => !t.terminee);
  if (filtreActif === "terminees") return taches.filter((t) => t.terminee);
  return taches;
}


/* ---------- 5. AFFICHAGE ---------- */

// Construit l'élément <li> d'une tâche.
// textContent (et non innerHTML) empêche l'injection de code HTML.
function creerElementTache(tache) {
  const li = document.createElement("li");
  li.className = "tache" + (tache.terminee ? " tache--terminee" : "");
  li.dataset.id = tache.id;

  const caseACocher = document.createElement("input");
  caseACocher.type = "checkbox";
  caseACocher.checked = tache.terminee;
  caseACocher.dataset.action = "basculer";
  caseACocher.setAttribute("aria-label", "Terminée : " + tache.titre);

  const titre = document.createElement("span");
  titre.className = "tache__titre";
  titre.textContent = tache.titre;

  const actions = document.createElement("div");
  actions.className = "tache__actions";

  const boutonModifier = document.createElement("button");
  boutonModifier.type = "button";
  boutonModifier.className = "btn-action";
  boutonModifier.dataset.action = "modifier";
  boutonModifier.textContent = "Modifier";

  const boutonSupprimer = document.createElement("button");
  boutonSupprimer.type = "button";
  boutonSupprimer.className = "btn-action btn-action--danger";
  boutonSupprimer.dataset.action = "supprimer";
  boutonSupprimer.textContent = "Supprimer";

  actions.append(boutonModifier, boutonSupprimer);
  li.append(caseACocher, titre, actions);
  return li;
}

// Redessine la liste complète selon le filtre actif
function afficherListe() {
  const visibles = tachesFiltrees();

  liste.replaceChildren(...visibles.map(creerElementTache));

  // Message affiché quand la liste est vide : il guide l'utilisateur
  const vide = visibles.length === 0;
  messageVide.hidden = !vide;
  if (vide) {
    messageVide.textContent = taches.length === 0
      ? "Aucune tâche. Ajoutez la première ci-dessus."
      : "Aucune tâche dans cette catégorie.";
  }
}

// Met à jour le texte du compteur, la barre de progression et le bouton du pied
function afficherCompteur() {
  const total = taches.length;
  const terminees = taches.filter((t) => t.terminee).length;
  const pourcentage = total === 0 ? 0 : Math.round((terminees / total) * 100);

  compteur.textContent = total === 0
    ? "Aucune tâche pour le moment."
    : (total - terminees) + " à faire sur " + total;

  barreProgression.style.width = pourcentage + "%";
  progression.setAttribute("aria-valuenow", pourcentage);

  boutonVider.disabled = terminees === 0;
}

// Enregistre puis réaffiche : à appeler après chaque modification
function mettreAJour() {
  sauvegarder();
  afficherListe();
  afficherCompteur();
}


/* ---------- 6. ÉVÉNEMENTS ---------- */

// Ajout d'une tâche via le formulaire (touche Entrée ou bouton)
formulaire.addEventListener("submit", (evenement) => {
  evenement.preventDefault();                     // évite le rechargement de la page
  ajouterTache(champTache.value);
  formulaire.reset();
  champTache.focus();
});

// Délégation d'événements : un seul écouteur pour tous les boutons de la liste
liste.addEventListener("click", (evenement) => {
  const element = evenement.target.closest("[data-action]");
  if (!element) return;

  const id = element.closest(".tache").dataset.id;

  switch (element.dataset.action) {
    case "basculer":   basculerTache(id);   break;
    case "modifier":   modifierTache(id);   break;
    case "supprimer":  supprimerTache(id);  break;
  }
});

// Changement de filtre
boutonsFiltre.forEach((bouton) => {
  bouton.addEventListener("click", () => {
    filtreActif = bouton.dataset.filtre;

    boutonsFiltre.forEach((b) => b.classList.toggle("filtre--actif", b === bouton));
    afficherListe();
  });
});

// Suppression groupée des tâches terminées
boutonVider.addEventListener("click", supprimerTerminees);


/* ---------- 7. INITIALISATION ---------- */

charger();
afficherListe();
afficherCompteur();
