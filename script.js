document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('date-input');
    const countrySelect = document.getElementById('country-select');
    const randomizeButton = document.getElementById('randomize-button');
    const eventsOutput = document.getElementById('events-output');
    const countryInfoOutput = document.getElementById('country-info-output');
    const holidaysOutput = document.getElementById('holidays-output');
    const scrollToTopButton = document.getElementById('scroll-to-top');

//set a scroll up botton 
    window.onscroll = function() {
        if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
            scrollToTopButton.style.display = "block";
        } else {
            scrollToTopButton.style.display = "none";
        }
    };

    scrollToTopButton.addEventListener('click', () => {
        document.body.scrollTop = 0; 
        document.documentElement.scrollTop = 0; 
    });

//Fetch Historical events api and make the event output
    function fetchHistoricalEvents(date) {
        const [year, month, day] = date.split('-');
        const apiUrl = `https://history.muffinlabs.com/date/${month}/${day}`;
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                const events = data.data.Events;
                displayEvents(events);
            })
            .catch(error => {
                console.log('Error fetching historical events:', error);
                eventsOutput.innerHTML = '<p>Failed to fetch historical events.</p>';
            });
    }

    function displayEvents(events) {
        eventsOutput.innerHTML = '<h2>Historical Events</h2>';
        while (eventsOutput.childNodes.length > 1) {
            eventsOutput.removeChild(eventsOutput.lastChild);
        }

        events.forEach(event => {
            const eventElement = document.createElement('div');
            let yearText = event.year.toString();
            if (yearText.includes(' or ')) {
                yearText = `${yearText} - ${yearText.split(' ')[0]}`;
            }
            const tempElement = document.createElement('div');
            tempElement.innerHTML = event.html;
            let eventText = tempElement.textContent;
            if (eventText.startsWith(yearText.split(' ')[0])) {
                eventText = eventText.slice(yearText.split(' ')[0].length).trim();
            }
            const eventDescription = event.html.replace(yearText.split(' ')[0], '').trim();
            eventElement.innerHTML = `<p><strong>${yearText}</strong> - ${eventDescription}</p>`;
            eventsOutput.appendChild(eventElement);
        });
    }

//Fetch country information dataset and make the country info output
    function fetchCountryInfo(country) {
        countryInfoOutput.innerHTML = ''; 
        fetch('https://apricot-maiga-80.tiiny.site/')
            .then(response => response.text())
            .then(data => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(data, 'text/html');
                const rows = doc.querySelectorAll('table tbody tr');
                let headers;
                let found = false;
                rows.forEach((row, index) => {
                    if (index === 0) {
                        headers = Array.from(row.children).map(header => header.textContent.trim());
                    } else if (row.children[0].textContent.trim().toLowerCase() === country.toLowerCase()) {
                        found = true;
                        displayCountryInfo(row, headers);
                    }
                });
                if (!found) {
                    countryInfoOutput.innerHTML = '<p>No information found for the selected country.</p>';
                }
            })
            .catch(error => {
                console.error('Error fetching country info:', error);
                countryInfoOutput.innerHTML = '<p>Failed to fetch country information.</p>';
            });
    }

    function displayCountryInfo(row, headers) {
        const table = document.createElement('table');
        table.classList.add('table', 'table-bordered');
        for (let i = 0; i < row.children.length; i++) {
            const headerText = headers[i];
            const valueText = row.children[i].textContent.trim();
            if (valueText !== '' && !valueText.includes('�')) { 
                const tr = document.createElement('tr');
                const th = document.createElement('th');
                th.textContent = headerText;
                const td = document.createElement('td');
                td.textContent = valueText;
                tr.appendChild(th);
                tr.appendChild(td);
                table.appendChild(tr);
            }
        }
        countryInfoOutput.appendChild(table);
    }

//Fetch public holidays api and make the holiday info output
    function fetchPublicHolidays(year, countryCode) {
        if (!countryCode) {
            holidaysOutput.innerHTML = '<p>Please select a country.</p>';
            return;
        }
        const apiUrl = `https://date.nager.at/api/v3/publicholidays/${year}/${countryCode}`;
        fetch(apiUrl)
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else if (response.status === 404) {
                    throw new Error('Public holidays not available for the selected country.');
                } else {
                    throw new Error('Error fetching public holidays.');
                }
            })
            .then(data => {
                const selectedDate = dateInput.value;
                const holidays = data.filter(holiday => holiday.date === selectedDate);
                if (holidays.length === 0) {
                    if (selectedDate.endsWith('-01-01')) {
                        const janFirstHoliday = data.find(holiday => holiday.date.endsWith('-01-01'));
                        if (janFirstHoliday) holidays.push(janFirstHoliday);
                    }
                }
                displayHolidays(holidays);
                checkIfWeekend(selectedDate);
            })
            .catch(error => {
                console.log('Error fetching public holidays:', error);
                holidaysOutput.innerHTML = `<p>${error.message}</p>`;
                checkIfWeekend(dateInput.value); 
            });
    }

    function displayHolidays(holidays) {
        holidaysOutput.innerHTML = '<h2>Public Holidays</h2>';
        if (holidays.length === 0) {
            holidaysOutput.innerHTML += '<p>No public holidays found for the selected date.</p>';
            return;
        }
        holidays.forEach(holiday => {
            const holidayElement = document.createElement('div');
            holidayElement.innerHTML = `
                <p>Date: ${holiday.date}</p>
                <p>Local Name: ${holiday.localName || 'N/A'}</p>
                <p>Name: ${holiday.name || 'N/A'}</p>
                <p>Country Code: ${holiday.countryCode || 'N/A'}</p>
                <p>Fixed: ${holiday.fixed || 'N/A'}</p>
                <p>Global: ${holiday.global || 'N/A'}</p>
                <p>Counties: ${holiday.counties || 'N/A'}</p>
                <p>Launch Year: ${holiday.launchYear || 'N/A'}</p>
                <p>Types: ${(holiday.types && holiday.types.join(', ')) || 'N/A'}</p>
            `;
            holidaysOutput.appendChild(holidayElement);
        });
    }

//Check if it's weekend day
    function checkIfWeekend(date) {
        const day = new Date(date).getUTCDay();
        const weekendMessage = day === 0 || day === 6 ? "It is a weekend day!" : "It is not a day on weekend.";
        holidaysOutput.innerHTML += `<p style="font-weight: bold; font-size: larger; color: #BF52F2">${weekendMessage}</p>`;
    }

//Set randomize button
    function randomizeSelection() {
        const randomYear = Math.floor(Math.random() * 101) + 1974;
        const randomMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
        const randomDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
        const formattedDate = `${randomYear}-${randomMonth}-${randomDay}`;
        dateInput.value = formattedDate;
        const randomCountryIndex = Math.floor(Math.random() * countrySelect.options.length);
        countrySelect.selectedIndex = randomCountryIndex;
        fetchHistoricalEvents(formattedDate);
        fetchCountryInfo(countrySelect.options[randomCountryIndex].textContent.replace(' (no holiday info)', ''));
        fetchPublicHolidays(randomYear, countrySelect.value);
    }

    randomizeButton.addEventListener('click', randomizeSelection);
    //Set space key uses for randomize button
    document.addEventListener('keydown', event => {
        if (event.code === 'Space') {
            event.preventDefault();
            randomizeSelection();
        }
    });

    dateInput.addEventListener('change', () => {
        fetchHistoricalEvents(dateInput.value);
        fetchPublicHolidays(new Date(dateInput.value).getFullYear(), countrySelect.value);
    });

    countrySelect.addEventListener('change', () => {
        const selectedCountry = countrySelect.options[countrySelect.selectedIndex].textContent.replace(' (no holiday info)', '');
        fetchCountryInfo(selectedCountry);
        fetchPublicHolidays(new Date(dateInput.value).getFullYear(), countrySelect.value);
    });

//Set 'toggle dark/light mode' button
    document.getElementById('theme-toggle').addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
    });
});
