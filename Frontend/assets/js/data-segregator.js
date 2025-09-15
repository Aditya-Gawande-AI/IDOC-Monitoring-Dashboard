document.addEventListener('DOMContentLoaded', function () {
    const dropZone = document.getElementById('drop-zone-file1');
    const fileInput = document.getElementById('file1');
    const fileInfo = document.getElementById('file-info-file1');
    const uploadDesc = dropZone.querySelector('.upload-desc');
    const dropText = dropZone.querySelector('.drop-text');

    function handleFile(file, source = 'Selected') {
        if (file && (file.name.endsWith('.zip') || file.name.endsWith('.tar'))) {
            fileInfo.style.display = 'block';
            fileInfo.innerText = `${source} file: ${file.name}`;
            uploadDesc.style.display = 'none';
            dropText.style.display = 'none';
        } else {
            alert('Please upload a .zip or .tar file.');
            fileInput.value = '';
            fileInfo.style.display = 'none';
            uploadDesc.style.display = '';
            dropText.style.display = '';
        }
    }

    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        handleFile(fileInput.files[0], 'Selected');
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        fileInput.files = e.dataTransfer.files;
        handleFile(file, 'Dropped');
    });
});




$('#integration-form').on('submit', function (e) {
  e.preventDefault();

  const systemName = $('#tenantName').val().trim();

  // Validation: Alphanumeric only, but not numbers-only
  const isAlphanumeric = /^[a-z0-9]+$/i.test(systemName);
  const isNumericOnly = /^[0-9]+$/.test(systemName);

  if (!isAlphanumeric) {
    Fnon.Hint.Danger("System name must be AlphaNumeric only.");
    return;
  }

  if (isNumericOnly) {
    Fnon.Hint.Danger("System name cannot be numbers only.");
    return;
  }

  const formData = {
    organisation: $('#organisationName').val(),
    SystemName: systemName,
    clientId: $('#clientId').val(),
    clientSecret: $('#clientSecret').val(),
    tenantUrl: $('#tenantUrl').val(),
    tokenUrl: $('#tokenUrl').val()
  };

  $.ajax({
    url: `${fe_url}/CredentialStore/submit-credentials/`,
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(formData),
    success: function (response) {
      Fnon.Hint.Success("Data saved successfully");
    },
    error: function (xhr, status, error) {
      Fnon.Hint.Danger("Error saving data.");
      console.error("Error:", error);
    }
  });
});

function compareXMLFiles() {
  const fileInput = document.getElementById('file1');
  const file = fileInput?.files?.[0];

  if (!file || !(file.name.endsWith('.zip') || file.name.endsWith('.tar'))) {
    alert('Please upload a valid ZIP or TAR file.');
    return;
  }

  const formData = new FormData();
  formData.append('zip_file', file); 

  $.ajax({
    url: 'https://ai-bis.cfapps.eu10.hana.ondemand.com/DataSegregator/api/segregate/',
    type: 'POST',
    data: formData,
    processData: false,
    contentType: false,
    success: function (response) {
      renderAccordion(response);
    },
    error: function (xhr, status, error) {
      console.error('Error:', xhr.responseText || error);
      alert('Failed to process the ZIP file.');
    }
  });
}

async function downloadAll(baseDir) {
  const payload = {
    base_directory: baseDir,
    category: "all"
  };
  await triggerDownload(payload, "Complete_Result");
}

async function downloadCategory(baseDir, category) {
  const payload = {
    base_directory: baseDir,
    category: category
  };
  await triggerDownload(payload, category);
}


async function downloadSubCategory(baseDir, category, segregationDetails, subKey) {
  let directoryName;

  if (category === 'Other_Data') {
    const miscData = segregationDetails[category]?.Miscellaneous_By_Extension || {};
    const subCategoryData = miscData[subKey];
    if (!subCategoryData) {
      alert(`Sub-category ${subKey} not found under ${category}`);
      return;
    }
    directoryName = subCategoryData.path.split('/').pop(); // Extract folder name from path
  } else {
    const categoryData = segregationDetails[category];
    if (!categoryData || !categoryData[subKey]) {
      alert(`Sub-category ${subKey} not found under ${category}`);
      return;
    }
    directoryName = categoryData[subKey].details?.directory_name || subKey;
    console.log("Directory Name:", directoryName);
  }

  const payload = {
    base_directory: baseDir,
    category: category,
    "sub-category": directoryName
  };

  console.log("sub-category payload:", payload);
  await triggerDownload(payload, `${category}_${directoryName}`);
}



async function triggerDownload(payload, zipName) {
  try {
    const response = await fetch('https://ai-bis.cfapps.eu10.hana.ondemand.com/DataSegregator/api/download/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log("Download response:", response);
    if (!response.ok) throw new Error('API call failed');

    const blob = await response.blob();
    if (blob.size === 0) {
      alert(`No data available for ${zipName}`);
      return;
    }
    console.log("Download blob size:", blob.size);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    
    link.download = `${zipName}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
  } catch (error) {
    console.error('Download error:', error);
    alert(`Failed to download ${zipName}`);
  }
}

let globalSegregationDetails = {};

function renderAccordion(data) {
    const accordionContainer = document.getElementById('resultContainer');
    accordionContainer.innerHTML = '';

    const baseDir = data.metadata?.temp_output_directory;
    globalSegregationDetails = data.segregation_details || {};
    const summary = data.summary || {};

    if (baseDir) {
        const downloadAllBtn = document.createElement('button');
        downloadAllBtn.className = 'btn btn-success mb-3';
        downloadAllBtn.innerHTML = '⬇️ Download Complete Result ZIP';
        downloadAllBtn.onclick = () => downloadAll(baseDir);
        accordionContainer.appendChild(downloadAllBtn);
    }

    const accordion = document.createElement('div');
    accordion.className = 'accordion';
    accordion.id = 'accordionExample';

    let index = 0;

    Object.entries(globalSegregationDetails).forEach(([category, categoryData]) => {
        let count = 0;
        if (category === 'Other_Data') {
            count = summary['miscellaneous_files'] || 0;
        } else {
            count = summary[`${category.toLowerCase()}_files`] || 0;
        }

        if (count === 0) return;

        const collapseId = `collapse${index}`;
        const headingId = `heading${index}`;
        const isFirst = index === 0 ? 'show' : '';
        const isCollapsed = index === 0 ? '' : 'collapsed';

        let fileDetailsHTML = '';

        if (category === 'Other_Data') {
            const miscData = categoryData?.Miscellaneous_By_Extension || {};
            Object.entries(miscData).forEach(([ext, extData]) => {
                const files = extData.files || [];
                if (files.length > 0) {
                    const subCategory = ext.toUpperCase();
                    fileDetailsHTML += `
                        <div class="mt-2">
                            <strong>${subCategory}</strong> (${files.length} files)
                            <a href="#" onclick="downloadSubCategory('${baseDir}', '${category}', globalSegregationDetails, '${ext}')" class="ms-2 text-decoration-none" title="Download ${subCategory} ZIP">⬇️</a>
                            <ul>
                                ${files.map(file => `<li>${file}</li>`).join('')}
                            </ul>
                        </div>
                    `;
                }
            });
        } else {
            Object.entries(categoryData).forEach(([subKey, subData]) => {
                const files = subData.files || [];
             
                if (files.length > 0) {
                    const subCategory = subData.details?.directory_name || subKey;
                    fileDetailsHTML += `
                        <div class="mt-2">
                            <strong>${subKey}</strong> (${files.length} files)
                            <a href="#" onclick="downloadSubCategory('${baseDir}', '${category}', globalSegregationDetails, '${subKey}')" class="ms-2 text-decoration-none" title="Download ${subCategory} ZIP">⬇️</a>
                            <ul>
                                ${files.map(file => `<li>${file}</li>`).join('')}
                            </ul>
                        </div>
                    `;
                }
            });
        }

        const accordionItem = `
            <div class="accordion-item">
                <h2 class="accordion-header" id="${headingId}">
                    <button class="accordion-button ${isCollapsed}" type="button" data-bs-toggle="collapse"
                        data-bs-target="#${collapseId}" aria-expanded="${isFirst ? 'true' : 'false'}" aria-controls="${collapseId}">
                        ${category} (${count} files)
                        <a href="#" onclick="downloadCategory('${baseDir}', '${category}')" class="ms-auto text-decoration-none" title="Download ${category} ZIP">⬇️</a>
                    </button>
                </h2>
                <div id="${collapseId}" class="accordion-collapse collapse ${isFirst}" aria-labelledby="${headingId}" data-bs-parent="#accordionExample">
                    <div class="accordion-body">
                        ${fileDetailsHTML || '<em>No detailed files listed.</em>'}
                    </div>
                </div>
            </div>
        `;

        accordion.insertAdjacentHTML('beforeend', accordionItem);
        index++;
    });

    accordionContainer.appendChild(accordion);
}
