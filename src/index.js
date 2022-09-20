import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  query,
  where,
  addDoc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDkx8fhcF6ONfR0JfeWpsxG1dY4SlnYeVg",
  authDomain: "fire-giftr-19c36.firebaseapp.com",
  projectId: "fire-giftr-19c36",
  storageBucket: "fire-giftr-19c36.appspot.com",
  messagingSenderId: "870978806402",
  appId: "1:870978806402:web:ce52531d695aa103710a9b",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
let people = [];
let months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
let selectedPersonId = null;

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("btnCancelPerson")
    .addEventListener("click", hideOverlay);
  document
    .getElementById("btnCancelIdea")
    .addEventListener("click", hideOverlay);
  document.getElementById("btnNoDelete").addEventListener("click", hideOverlay);
  // document.querySelector(".overlay").addEventListener("click", hideOverlay);

  document
    .getElementById("btnAddPerson")
    .addEventListener("click", showOverlay);
  document
    .getElementById("btnYesDelete")
    .addEventListener("click", deletePerson);

  document
    .getElementById("btnSavePerson")
    .addEventListener("click", savePerson);

  document.getElementById("btnAddIdea").addEventListener("click", showOverlay);
  document.getElementById("btnSaveIdea").addEventListener("click", saveGift);

  document
    .querySelector(".person-list")
    .addEventListener("click", handleSelectPerson);

  loadInitialData();
});

function hideOverlay(ev) {
  if (ev) {
    ev.preventDefault();
    if (ev.target.id == "btnCancelPerson") {
      document.getElementById("name").value = "";
      document.getElementById("month").value = "";
      document.getElementById("day").value = "";
    }
  }
  document.querySelector(".overlay").classList.remove("active");
  document
    .querySelectorAll(".overlay dialog")
    .forEach((dialog) => dialog.classList.remove("active"));
  let dlgHeading = document.querySelector(".dlgHeading");
  dlgHeading.innerHTML = "Add Person";
  let li = document.querySelector(`[data-id="${selectedPersonId}"]`);
  li.click();
}
function showOverlay(ev) {
  let overlay = document.querySelector(".overlay");
  let id;
  if (ev) {
    ev.preventDefault();
    id = ev.target.id === "btnAddIdea" ? "dlgIdea" : "dlgPerson";
  } else if (overlay.classList.contains("delete")) {
    id = "dlgDeletePerson";
  } else {
    id = "dlgPerson";
  }
  document.querySelector(".overlay").classList.add("active");
  //TODO: check that person is selected before adding an idea
  document.getElementById(id).classList.add("active");
}

function loadInitialData() {
  getPeople();
}

async function getPeople() {
  const querySnapshot = await getDocs(collection(db, "people"));
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const id = doc.id;
    people.push({ id, ...data });
  });
  buildPeople(people);
}

function buildPeople(people) {
  let ul = document.querySelector("ul.person-list");
  ul.innerHTML = people
    .map((person) => {
      const dob = `${months[person["birth-month"] - 1]} ${person["birth-day"]}`;
      return `<li data-id="${person.id}" data-name="${person[
        "name"
      ].toLowerCase()}" class="person">
            <div>
            <p class="name">${person.name}</p>
            <p class="dob">${dob}</p>
            </div>
            <div class="editDelBtns">
            <button class="edit btnEditPerson">Edit</button>
            <button class="delete btnDeletePerson">Delete</button>
            </div>
          </li>`;
    })
    .join("");
  selectedPersonId = people[0].id;

  let li = document.querySelector(`[data-id="${selectedPersonId}"]`);
  li.click();
}

async function handleSelectPerson(ev) {
  const li = ev.target.closest(".person");
  li.click();
  const id = li ? li.getAttribute("data-id") : null;
  if (id) {
    selectedPersonId = id;
    let docRef = doc(collection(db, "people"), selectedPersonId);
    const docSnap = await getDoc(docRef);
    if (ev.target.classList.contains("edit")) {
      let dlgHeading = document.querySelector(".dlgHeading");
      dlgHeading.innerHTML = "Edit Person";
      let btnSave = document.querySelector("#btnSavePerson");
      btnSave.dataset.id = id;
      showOverlay();
      document.getElementById("name").value = docSnap.data().name;
      document.getElementById("month").value = docSnap.data()["birth-month"];
      document.getElementById("day").value = docSnap.data()["birth-day"];
    } else if (ev.target.classList.contains("delete")) {
      let overlay = document.querySelector(".overlay");
      overlay.classList.add("delete");
      showOverlay();
      overlay.classList.remove("delete");
    } else {
      document.querySelector("li.selected")?.classList.remove("selected");
      li.classList.add("selected");
      getIdeas(id);
    }
  } else {
    //clicked a button not inside <li class="person">
    //Show the dialog form to ADD the doc (same form as EDIT)
    //showOverlay function can be called from here or with the click listener in DOMContentLoaded, not both
  }
}

async function getIdeas(id) {
  const personRef = doc(collection(db, "people"), id);
  const docs = query(
    collection(db, "gift-ideas"),
    where("person-id", "==", personRef)
  );
  const querySnapshot = await getDocs(docs);
  const ideas = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const id = doc.id;
    ideas.push({
      id,
      title: data.idea,
      location: data.location,
      bought: data.bought,
      person_id: data["person-id"].id,
      person_ref: data["person-id"],
    });
  });
  buildIdeas(ideas);
}

function buildIdeas(ideas) {
  const ul = document.querySelector(".idea-list");
  if (ideas.length) {
    ul.innerHTML = ideas
      .map((idea) => {
        return `<li class="idea" data-id="${idea.id}">
                <label for="chk-${idea.id}"
                  ><input type="checkbox" id="chk-${idea.id}" /> Bought</label
                >
                <p class="title">${idea.title}</p>
                <p class="location">${idea.location}</p>
              </li>`;
      })
      .join("");
  } else {
    ul.innerHTML =
      '<li class="idea"><p></p><p>No Gift Ideas for selected person.</p></li>';
  }
}

async function savePerson(ev) {
  let name = document.getElementById("name").value;
  let month = document.getElementById("month").value;
  let day = document.getElementById("day").value;
  if (!name || !month || !day) return; //form needs more info
  const person = {
    name,
    "birth-month": month,
    "birth-day": day,
  };
  try {
    let btnSavePerson = document.getElementById("btnSavePerson");
    let id = btnSavePerson.dataset.id;
    if (id) {
      const docRef = doc(collection(db, "people"), id);
      await setDoc(docRef, person);
      person.id = id;
      hideOverlay();
      tellUser("Updated the database");
    } else {
      const docRef = await addDoc(collection(db, "people"), person);
      person.id = docRef.id;
      hideOverlay();
      tellUser(`${person.name} added to database`);
    }
    document.getElementById("name").value = "";
    document.getElementById("month").value = "";
    document.getElementById("day").value = "";
    showPerson(person);
  } catch (err) {
    console.error("Error adding document: ", err);
    tellUser("Error adding document", err);
  }
}

async function deletePerson() {
  await deleteDoc(doc(db, "people", selectedPersonId));
  hideOverlay();
  people = [];
  getPeople();
  tellUser("Person deleted");
}

function showPerson(person) {
  let li = document.querySelector(`[data-id="${person.id}"]`);
  if (li) {
    //update on screen
    const dob = `${months[person["birth-month"] - 1]} ${person["birth-day"]}`;
    let personName = person["name"].toLowerCase();
    li.outerHTML = `<li data-id="${person.id}" data-name="${personName}" class="person">
            <div>
            <p class="name">${person.name}</p>
            <p class="dob">${dob}</p>
            </div>
            <div class="editDelBtns">
            <button class="edit btnEditPerson">Edit</button>
            <button class="delete btnDeletePerson">Delete</button>
            </div
          </li>`;
  } else {
    //add to screen
    const dob = `${months[person["birth-month"] - 1]} ${person["birth-day"]}`;
    let personName = person["name"].toLowerCase();
    li = `<li data-id="${person.id}" data-name="${personName}" class="person">
            <div>
            <p class="name">${person.name}</p>
            <p class="dob">${dob}</p>
            </div>
            <div class="editDelBtns">
            <button class="edit btnEditPerson">Edit</button>
            <button class="delete btnDeletePerson">Delete</button>
            </div>
          </li>`;
    document.querySelector("ul.person-list").innerHTML += li;
  }
}

function tellUser(msg, err) {
  const dlg = document.getElementById("tellUser");
  if (err) {
    dlg.innerHTML = `<h2>Failed!</h2>
          <p>${msg}</p>
          <button id="btnOk">Ok</button>`;
  } else {
    dlg.innerHTML = `<h2>Successful!</h2>
          <p>${msg}</p>
          <button id="btnOk">Ok</button>`;
  }
  document.querySelector(".overlay").classList.add("active");
  document.getElementById("tellUser").classList.add("active");
  document.getElementById("btnOk").addEventListener("click", hideOverlay);
}

async function saveGift(ev) {
  let idea = document.getElementById("title").value;
  let location = document.getElementById("location").value;
  if (!title || !location) return; //form needs more info
  const personRef = doc(db, `/people/${selectedPersonId}`);
  const giftIdea = {
    idea,
    location,
    "person-id": personRef,
  };

  try {
    const docRef = await addDoc(collection(db, "gift-ideas"), giftIdea);
    console.log(docRef);
    console.log(docRef.id);
    giftIdea.id = docRef.id;
    document.getElementById("title").value = "";
    document.getElementById("location").value = "";
    hideOverlay();
    tellUser("Gift added to the database");
    getIdeas(selectedPersonId);
  } catch (err) {
    console.error("Error adding document: ", err);
    tellUser("Error adding document", err);
  }
  //TODO: update this function to work as an UPDATE method too
}
