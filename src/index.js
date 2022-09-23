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
  updateDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
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
let selectedGiftId = null;

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("btnCancelPerson")
    .addEventListener("click", hideOverlay);
  document
    .getElementById("btnCancelIdea")
    .addEventListener("click", hideOverlay);
  document.getElementById("btnNoDelete").addEventListener("click", hideOverlay);
  document
    .getElementById("btnNoDelGift")
    .addEventListener("click", hideOverlay);

  document
    .getElementById("btnAddPerson")
    .addEventListener("click", showOverlay);
  document
    .getElementById("btnYesDelPerson")
    .addEventListener("click", deletePerson);

  document
    .getElementById("btnSavePerson")
    .addEventListener("click", savePerson);

  document.getElementById("btnAddIdea").addEventListener("click", showOverlay);
  document.getElementById("btnSaveIdea").addEventListener("click", saveGift);
  document
    .getElementById("btnYesDelGift")
    .addEventListener("click", deleteGift);

  document
    .querySelector(".person-list")
    .addEventListener("click", handleSelectPerson);

  document
    .querySelector(".idea-list")
    .addEventListener("click", handleSelectGift);

  const qPeople = query(collection(db, "people"));
  const unsubscribe = onSnapshot(
    qPeople,
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          let newDoc = change.doc.data();
          showPerson({
            name: newDoc.name,
            "birth-month": newDoc["birth-month"],
            "birth-day": newDoc["birth-day"],
            id: change.doc.id,
          });
        }
        if (change.type === "modified") {
          let newDoc = change.doc.data();
          showPerson({
            name: newDoc.name,
            "birth-month": newDoc["birth-month"],
            "birth-day": newDoc["birth-day"],
            id: change.doc.id,
          });
        }
        if (change.type === "removed") {
          let li = document.querySelector(`li[data-id="${change.doc.id}"]`);
          li.parentElement.removeChild(li);
          selectedPersonId = null;
        }
      });
    },
    (err) => {
      console.error("Error: ", err);
    }
  );

  const qIdeas = query(collection(db, "gift-ideas"));
  const unsubscribeIdeas = onSnapshot(
    qIdeas,
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          let newDoc = change.doc.data();
          getIdeas(selectedPersonId);
        }
        if (change.type === "modified") {
          getIdeas(selectedPersonId);
        }
        if (change.type === "removed") {
          getIdeas(selectedPersonId);
        }
      });
    },
    (err) => {
      console.error("Error: ", err);
    }
  );

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
    if (ev.target.id == "btnCancelIdea") {
      document.getElementById("title").value = "";
      document.getElementById("location").value = "";
    }
  }
  document.querySelector(".overlay").classList.remove("active");
  document
    .querySelectorAll(".overlay dialog")
    .forEach((dialog) => dialog.classList.remove("active"));

  let dlgPersonHeading = document.querySelector(".dlgPersonHeading");
  dlgPersonHeading.innerHTML = "Add Person";
  let dlgGiftHeading = document.querySelector(".dlgGiftHeading");
  dlgGiftHeading.innerHTML = "Add Gift Idea";
  if (selectedPersonId) {
    let li = document.querySelector(`[data-id="${selectedPersonId}"]`);
    li.click();
  }
}
function showOverlay(ev) {
  let overlay = document.querySelector(".overlay");
  let id;
  if (ev) {
    ev.preventDefault();
    id = ev.target.id === "btnAddIdea" ? "dlgIdea" : "dlgPerson";
  } else if (overlay.classList.contains("deletePerson")) {
    id = "dlgDeletePerson";
  } else if (overlay.classList.contains("editGift")) {
    id = "dlgIdea";
  } else if (overlay.classList.contains("deleteGift")) {
    id = "dlgDeleteGift";
  } else {
    id = "dlgPerson";
  }
  document.querySelector(".overlay").classList.add("active");
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
  if (people.length) {
    ul.innerHTML = people
      .map((person) => {
        const dob = `${months[person["birth-month"] - 1]} ${
          person["birth-day"]
        }`;
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
  } else {
    ul.innerHTML = '<li class="noPerson"><p>The People list is empty.</p></li>';
    selectedPersonId = null;
    const ulIdea = document.querySelector(".idea-list");
    ulIdea.innerHTML =
      '<li class="noIdea"><p>No Gift Ideas for selected person.</p></li>';
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
  const personRef = doc(collection(db, "people"), selectedPersonId);
  await deleteDoc(doc(db, "people", selectedPersonId));
  const docs = query(
    collection(db, "gift-ideas"),
    where("person-id", "==", personRef)
  );
  const qSnapshot = await getDocs(docs);
  qSnapshot.forEach((doc) => {
    selectedGiftId = doc.id;
    deleteGift();
  });
  selectedGiftId = null;
  hideOverlay();
  people = [];
  getPeople();
  tellUser("Person deleted");
}

function showPerson(person) {
  let li = document.querySelector(`li[data-id="${person.id}"]`);
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
    let noPersonMsg = document.querySelector(".noPerson");
    if (noPersonMsg) {
      noPersonMsg.parentElement.removeChild(noPersonMsg);
    }
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
    if (!selectedPersonId) {
      selectedPersonId = person.id;
    }
  }
  li = document.querySelector(`[data-id="${selectedPersonId}"]`);
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
      let dlgHeading = document.querySelector(".dlgPersonHeading");
      dlgHeading.innerHTML = "Edit Person";
      let btnSave = document.querySelector("#btnSavePerson");
      btnSave.dataset.id = id;
      showOverlay();
      document.getElementById("name").value = docSnap.data().name;
      document.getElementById("month").value = docSnap.data()["birth-month"];
      document.getElementById("day").value = docSnap.data()["birth-day"];
    } else if (ev.target.classList.contains("delete")) {
      let overlay = document.querySelector(".overlay");
      overlay.classList.add("deletePerson");
      showOverlay();
      overlay.classList.remove("deletePerson");
    } else {
      document.querySelector("li.selected")?.classList.remove("selected");
      li.classList.add("selected");
      getIdeas(id);
    }
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

                <label for="chk-${idea.id}">
                <input type="checkbox" id="chk-${idea.id}" class="checkbox"/> Bought</label>
                <p class="title">${idea.title}</p>
                <p class="location">${idea.location}</p>
                <button class="edit btnEditGift">Edit</button>
                <button class="delete btnDeleteGift">Delete</button>
                </li>`;
      })
      .join("");

    ideas.forEach((idea) => {
      let checkbox = document.querySelector(`input[id=chk-${idea.id}]`);
      checkbox.addEventListener("change", checkboxUpdate);
      if (idea.bought) {
        checkbox.checked = true;
      }
    });
  } else {
    ul.innerHTML =
      '<li class="noIdea"><p>No Gift Ideas for selected person.</p></li>';
  }
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
    let btnSaveIdea = document.getElementById("btnSaveIdea");
    let id = btnSaveIdea.dataset.id;
    if (id) {
      const docRef = doc(collection(db, "gift-ideas"), id);
      await setDoc(docRef, giftIdea);
      giftIdea.id = id;
      hideOverlay();
      tellUser("Updated the Gift Idea");
    } else {
      giftIdea.bought = false;
      const docRef = await addDoc(collection(db, "gift-ideas"), giftIdea);
      giftIdea.id = docRef.id;
      hideOverlay();

      tellUser("Gift idea added to the database");
    }
    document.getElementById("title").value = "";
    document.getElementById("location").value = "";
  } catch (err) {
    console.error("Error adding document: ", err);
    tellUser("Error adding document", err);
  }
}

async function deleteGift() {
  await deleteDoc(doc(db, "gift-ideas", selectedGiftId));
  hideOverlay();
  tellUser("Gift idea deleted");
}

async function handleSelectGift(ev) {
  const li = ev.target.closest(".idea");
  li.click();
  const id = li ? li.getAttribute("data-id") : null;
  let overlay = document.querySelector(".overlay");
  if (id) {
    selectedGiftId = id;
    let docRef = doc(collection(db, "gift-ideas"), id);
    const docSnap = await getDoc(docRef);
    if (ev.target.classList.contains("edit")) {
      let dlgHeading = document.querySelector(".dlgGiftHeading");
      dlgHeading.innerHTML = "Edit Gift Idea";
      let btnSave = document.querySelector("#btnSaveIdea");
      btnSave.dataset.id = id;
      overlay.classList.add("editGift");
      showOverlay();
      overlay.classList.remove("editGift");
      document.getElementById("title").value = docSnap.data().idea;
      document.getElementById("location").value = docSnap.data().location;
    } else if (ev.target.classList.contains("delete")) {
      let overlay = document.querySelector(".overlay");
      overlay.classList.add("deleteGift");
      showOverlay();
      overlay.classList.remove("deleteGift");
    }
  }
}

async function checkboxUpdate(ev) {
  const docRef = doc(collection(db, "gift-ideas"), selectedGiftId);

  if (ev.target.checked) {
    await updateDoc(docRef, { bought: true });
  } else {
    await updateDoc(docRef, { bought: false });
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
