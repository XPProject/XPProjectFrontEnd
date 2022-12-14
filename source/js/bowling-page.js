// REST API URLs to connect to back-end
const localLaneApi = "http://localhost:8080/api/v1/bowling-lane";
const localBowlingBookingApi = "http://localhost:8080/api/v1/bowling-booking";

// HTML Button element which will trigger generation
const buttCreateTable = document.getElementById("generateTable");
// Edit Lane State
let editLaneState = document.getElementById("editLaneStates");
// Table from HTML template
const tableBody = document.getElementById("tableBody");
// HTML date input field that the user changes to see bookings for a specific day
let datePicker = document.getElementById("date");

let laneArr = [];
let bookingArr = [];

document.addEventListener("DOMContentLoaded", () => {buttCreateTable.click();});

function createBowlingLaneCountColumn(row, rowCount) {
    // Generate the first cell, used for the row number
    let laneNumber = row.insertCell();
    // Establish first cell text as the bowling lane number
    laneNumber.innerText = rowCount;
}

/**
 * Takes care of the logic behind the pop-up window that appears when clicking a cell.
 * @param cell HTML element representing the cell that has been selected
 * @param rowCount Integer representing the row where the cell resides
 * @param isBooked Boolean that is passed for conditional logic for a booked vs. a free cell.
 * @param booking Optional object that represents the booking itself, if any.
 */


function handleModal(cell, rowCount, isBooked, booking) {
    // Handle modal logic
    cell.addEventListener('click', () => {
        // If the modal is being displayed, hide it and stop the rest of the function from executing
        if (!(modal.style.display === "none")) {
            modal.style.display = "none";
            return;
        }
        // If the modal is not being displayed, display it
        modal.style.display = "block";
        modalTitle.innerText = "Bowling Lane " + rowCount;

        // If the selected cell corresponds to a booking
        if (isBooked) {
            // Set datetime input fields values to booking values
            startDateTime.value = booking.startDateTime;
            endDateTime.value = booking.endDateTime;
            // If there is a customer, set input field values to customer particulars
            if (booking['customer']['id'] !== null) {
                customerFirstName.value = booking['customer']['firstName'];
                customerLastName.value = booking['customer']['lastName'];
                customerTelephone.value = booking['customer']['phoneNumber'];
            }
            // Show buttons for PUT and DELETE, hide POST
            bookButton.setAttribute("style", "display: none");
            confirmChangesButton.setAttribute("style", "display: block");
            cancelButton.setAttribute("style", "display: block");

            confirmChangesButton.addEventListener('click', async function () {
                const fetchOptions = {
                    method: "PUT",
                    headers: {
                        "Content-type": "application/json"
                    },
                    body: ""
                }

                const updatedBooking = {
                    "id": booking.id,
                    "startDateTime": startDateTime.value
                        .replace('T', ' ') + ":00",
                    "endDateTime": endDateTime.value
                        .replace('T', ' ') + ":00",
                    "customer": {
                        "firstName": customerFirstName.value,
                        "lastName": customerLastName.value,
                        "phoneNumber": customerTelephone.value,
                    },
                    "bowlingLane": {
                        "id": rowCount,
                        "inOrder": true,
                        "booked": false
                    }
                }

                fetchOptions.body = JSON.stringify(updatedBooking);
                const response = await fetch(localBowlingBookingApi + "/" + booking.id, fetchOptions);
                // Refresh page on reload
                if (response.ok) {
                    document.location.reload();

                    /*
                    FIX NEEDED
                    */
                    datePicker.value = startDateTime.value;
                    /*
                    FIX NEEDED
                    */
                }
                return response;
            });

            cancelButton.addEventListener("click", function (evt) {
                deleteRequest(evt, booking['id'], booking).then(r => console.log(r));
            });
            // If the selected cell does not correspond to a booking
        }
        else {
            // Empty customer input fields from potential previous values
            customerFirstName.value = "";
            customerLastName.value = "";
            customerTelephone.value = "";
            // Store two variables with date objects from datePicker
            let selectedStartDateTime = new Date(datePicker.value);
            let selectedEndDateTime = new Date(datePicker.value);

            /*
            FIX NEEDED
            */
            // Assign hours to dates, adding 2 hours because javascript, weird conversion from GMT+2 to UTC
            selectedStartDateTime.setHours(cell.timeSlot + 2);
            selectedEndDateTime.setHours(cell.timeSlot + 3);

            // ValueAsDate does not appear to work on Chrome, will have to find a workaround
            startDateTime.valueAsDate = selectedStartDateTime;
            endDateTime.valueAsDate = selectedEndDateTime;
            /*
            FIX NEEDED
            */

            // Show button for POST and hide buttons for PUT and DELETE
            bookButton.setAttribute("style", "display: block");
            confirmChangesButton.setAttribute("style", "display: none");
            cancelButton.setAttribute("style", "display: none");

            // Prepare POST method on bookButton
            bookButton.addEventListener('click', async function () {
                const fetchOptions = {
                    method: "POST",
                    headers: {
                        "Content-type": "application/json"
                    },
                    body: ""
                }

                const newBooking = {
                    "startDateTime": startDateTime.value
                        .replace('T', ' ') + ":00",
                    "endDateTime": endDateTime.value
                        .replace('T', ' ') + ":00",
                    "customer": {
                        "firstName": customerFirstName.value,
                        "lastName": customerLastName.value,
                        "phoneNumber": customerTelephone.value,
                    },
                    "bowlingLane": {
                        "id": rowCount,
                        "inOrder": true,
                        "booked": false
                    }
                }

                fetchOptions.body = JSON.stringify(newBooking);

                const response = await fetch(localBowlingBookingApi, fetchOptions);
                // Refresh page on reload
                if (response.ok) {
                    document.location.reload();

                    /*
                    FIX NEEDED
                    */
                    datePicker.value = startDateTime.value;
                    /*
                    FIX NEEDED
                    */
                }
                return response;
            });
        }
    })
    ;
// Close window on button click
    closeButton.addEventListener('click', () => {
        modal.style.display = "none"
    });
}
async function deleteRequest(evt, id) {
    const fetchOptions = {
        method: "DELETE",
        headers: {
            "Content-type": "application/json"
        },
        body: ""
    }
    const response = await fetch(localBowlingBookingApi + "/" + id, fetchOptions);

    // Refresh page on reload
    if (response.ok) {
        document.location.reload();

        /*
        FIX NEEDED
        */
        datePicker.value = startDateTime.value;
        /*
        FIX NEEDED
        */
    }
    return response;
}

/**
 * Determines whether a cell is booked or not at table generation.
 * Taken advantage of to also add modal pop-up on click event to each one of them
 * @param cell
 * @param bookingArr
 * @param rowCount
 */
function loadIndividualCell(cell, bookingArr, rowCount) {

    cell.classList.add("interactive-cell");

    // forEach won't work here because it does not support break
    let booked = false;
    for (let booking of bookingArr) {
        if (booking['bowlingLane']['id'] === rowCount) {
            let bookingStartDateTime = new Date(Date.parse(booking['startDateTime']));
            let bookingEndDateTime = new Date(Date.parse(booking['endDateTime']));
            let selectedStartDateTime = new Date(datePicker.value);
            let selectedEndDateTime = new Date(datePicker.value);
            selectedStartDateTime.setHours(cell.timeSlot);
            selectedEndDateTime.setHours(cell.timeSlot + 1);

            if (bookingStartDateTime < selectedEndDateTime && bookingEndDateTime > selectedStartDateTime) {
                booked = true;
                establishCellState(false, booking);
                break;
            }
        }
    }
    if (!booked) establishCellState(true);

    function establishCellState(isFree, booking) {
        if (!isFree) {
            cell.innerText = "Booked";
            cell.classList.add("cellBooked");
            handleModal(cell, rowCount, true, booking);
            return;
        }
        cell.innerText = "Free";
        cell.classList.add("cellFree");
        handleModal(cell, rowCount, false, null);


        // Differentiate regular lanes from lanes reserved for children as per customer requirements
        if (rowCount > 20) {
            cell.classList.add("kid");
        }
    }
}

//Adds a last cell that allows to disable a lane
function loadOutOfOrderCell(cell, lane) {
    if (lane.inOrder == true) {
        cell.classList.add("hideColumn")
        cell.classList.add("inOrder");
        cell.classList.add("lastColumn")
        cell.addEventListener('click', () => {
            putOutOfOrder(lane.id, false)
        })
    } else {
        cell.classList.add("hideColumn")
        cell.classList.add("lastColumn")
        cell.classList.add("outOfOrderColumn");
        cell.addEventListener('click', () => {
            putOutOfOrder(lane.id, true)
        })
    }
}

async function putOutOfOrder(rowCount, state) {
    const fetchOptions = {
        method: "POST",
        headers: {
            "Content-type": "application/json"
        },
        body: ""
    }
    const updateLaneState = {
        "id": rowCount,
        "booked": false,
        "inOrder": state
    }

    fetchOptions.body = JSON.stringify(updateLaneState);
    const response = await fetch(localLaneApi, fetchOptions);
    if (response.ok) {
        document.location.reload();

        /*
        FIX NEEDED
        */

        /*
        FIX NEEDED
        */
    }
    return response;

}

function createRow(lane) {
    // Row which is currently being generated established by the entity ID from the back-end
    const rowCount = lane.id;
    // Generating row itself, no cells yet.
    let row = tableBody.insertRow(rowCount -1)
    createBowlingLaneCountColumn(row, rowCount);
    if (lane.inOrder == true) {
        // Populate all 12 timeslots with cells
        for (let i =1; i < 13; i++) {
            row.insertCell(i);
            // Create new "timeSlot" property for all cells where we store their respective time slot.
            // Assign start hour into new property (e.g. 9 + 1 = 10:00 )
            row.cells.item(i).timeSlot = 9 + i;
            loadIndividualCell(row.cells.item(i), bookingArr, rowCount)
        }
    } else {
        for (let i = 1; i < 13; i++) {
            row.insertCell(i);
            row.cells.item(i).classList.add("interactive-cell");
            row.cells.item(i).classList.add("outOfOrder");
            row.cells.item(i).textContent = '';
        }
    }
    row.insertCell(13)
    //adds last cell to disable lane
    loadOutOfOrderCell(row.cells.item(13), lane)
}

async function fetchBookings(url) {
    return fetch(url).then(response => response.json());
}

async function fetchLanes(url) {
    return fetch(url).then(response => response.json());
}

async function doFetch() {
    laneArr = await fetchLanes(localLaneApi);
    bookingArr = await fetchBookings(localBowlingBookingApi);
    tableBody.innerHTML = "";
    laneArr.forEach(createRow);
}

buttCreateTable.addEventListener('click', doFetch)

//sets date to today's
document.getElementById('date').valueAsDate = new Date();

//edit lane state visible
editLaneState.toggled = false;
editLaneState.addEventListener('click', () => {
        const lastColumns = document.getElementsByClassName("lastColumn")
        for (let i = 0; i < lastColumns.length; i++) {
            lastColumns.item(i).classList.toggle("hideColumn")}
        })

datePicker.valueAsDate = new Date();

