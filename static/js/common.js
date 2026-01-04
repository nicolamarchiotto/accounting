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
function fillSelect(selectElem, items, valueField="id", textField="name", includeEmpty=true, array_of_strings=false) {
     if (!selectElem) {
        console.warn("fillSelect: select element not found");
        return;
    }
    selectElem.innerHTML = "";
    if (includeEmpty) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "-- Select --";
        selectElem.appendChild(option);
    }
    
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

// Utility to fill multi-select options
function fillMultiSelect(selectElem, items, valueField="id", textField="name") {
    selectElem.innerHTML = "";
    for (const item of items) {
        const option = document.createElement("option");
        option.value = item[valueField];
        option.textContent = item[textField];
        selectElem.appendChild(option);
    }
}