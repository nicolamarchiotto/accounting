async function fetchJson(url, method="GET", body=null) {
    const options = { method, headers: { "Content-Type": "application/json" } };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(url, options);
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Request failed");
    }
    return res.json();
}

// Utility to fill select options
function fillSelect(selectElem, items, valueField="id", textField="name", emptyOption = "-- Select --", array_of_strings=false) {
     if (!selectElem) {
        console.warn("fillSelect: select element not found");
        return;
    }
    selectElem.innerHTML = "";
    const option = document.createElement("option");
    option.value = "";
    option.textContent = emptyOption;
    selectElem.appendChild(option);
    
    if(array_of_strings) {
        for (const item of items) {
            const option = document.createElement("option");
            option.value = item;
            option.textContent = item;
            selectElem.appendChild(option);
        }
        return;
    }else {
        for (const item of items) {
            const option = document.createElement("option");
            option.value = item[valueField];
            option.textContent = item[textField];
            selectElem.appendChild(option);
        }
    }
}