import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  query,
  where,
  addDoc,
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
const people = [];
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
  // document.querySelector(".overlay").addEventListener("click", hideOverlay);

  document
    .getElementById("btnAddPerson")
    .addEventListener("click", showOverlay);
  document.getElementById("btnSaveIdea").addEventListener("click", showOverlay);

  document
    .getElementById("btnSavePerson")
    .addEventListener("click", savePerson);
  // document.getElementById("btnSaveIdea").addEventListener("click", saveIdea);

  document
    .querySelector(".person-list")
    .addEventListener("click", handleSelectPerson);

  loadInitialData();
});

function hideOverlay(ev) {
  if (ev) ev.preventDefault();
  document.querySelector(".overlay").classList.remove("active");
  document
    .querySelectorAll(".overlay dialog")
    .forEach((dialog) => dialog.classList.remove("active"));
}
function showOverlay(ev) {
  ev.preventDefault();
  document.querySelector(".overlay").classList.add("active");
  const id = ev.target.id === "btnAddPerson" ? "dlgPerson" : "dlgIdea";
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
      return `<li data-id="${person.id}" class="person">
            <p class="name">${person.name}</p>
            <p class="dob">${dob}</p>
          </li>`;
    })
    .join("");

  selectedPersonId = people[0].id;

  let li = document.querySelector(`[data-id="${selectedPersonId}"]`);
  li.click();
}

function handleSelectPerson(ev) {
  const li = ev.target.closest(".person");
  const id = li ? li.getAttribute("data-id") : null;
  if (id) {
    selectedPersonId = id;
    if (ev.target.classList.contains("edit")) {
      //EDIT the doc using the id to get a docRef
      //show the dialog form to EDIT the doc (same form as ADD)
      //Load all the Person document details into the form from docRef
    } else if (ev.target.classList.contains("delete")) {
      //DELETE the doc using the id to get a docRef
      //do a confirmation before deleting
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
    //work with the resulting docs
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
      '<li class="idea"><p></p><p>No Gift Ideas for selected person.</p></li>'; //clear in case there are no records to shows
  }
}

async function savePerson(ev) {
  //function called when user clicks save button from person dialog
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
    const docRef = await addDoc(collection(db, "people"), person);
    //1. clear the form fields
    document.getElementById("name").value = "";
    document.getElementById("month").value = "";
    document.getElementById("day").value = "";
    //2. hide the dialog and the overlay
    hideOverlay();
    //3. display a message to the user about success
    // tellUser(`Person ${name} added to database`);
    person.id = docRef.id;
    //4. ADD the new HTML to the <ul> using the new object
    showPerson(person);
  } catch (err) {
    console.error("Error adding document: ", err);
    //do you want to stay on the dialog?
    //display a mesage to the user about the problem
  }
}

function showPerson(person) {
  let li = document.getElementById(person.id);
  if (li) {
    //update on screen
    const dob = `${months[person["birth-month"] - 1]} ${person["birth-day"]}`;
    li.outerHTML = `<li data-id="${person.id}" class="person">
            <p class="name">${person.name}</p>
            <p class="dob">${dob}</p>
          </li>`;
  } else {
    //add to screen
    const dob = `${months[person["birth-month"] - 1]} ${person["birth-day"]}`;
    li = `<li data-id="${person.id}" class="person">
            <p class="name">${person.name}</p>
            <p class="dob">${dob}</p>
          </li>`;
    document.querySelector("ul.person-list").innerHTML += li;
  }
}
