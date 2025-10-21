let portfolioData = [];

// Fungsi Simpan ke localStorage 
function saveToStorage() {
    localStorage.setItem('portfolioData', JSON.stringify(portfolioData));
}

// Fungsi Load Portfolio dari localStorage atau JSON
function loadPortfolio() {
    // Cek localStorage dulu (untuk update otomatis dari admin)
    const storedData = localStorage.getItem('portfolioData');
    if (storedData) {
        portfolioData = JSON.parse(storedData);
        if (document.getElementById('portfolio-grid')) {
            renderPortfolio();
        }
        if (document.getElementById('projectList')) {
            renderProjectList();
        }
        return;
    }

    // Fallback ke JSON jika localStorage kosong
    fetch('portfolio.json')
        .then(response => {
            if (!response.ok) throw new Error('JSON tidak ditemukan');
            return response.json();
        })
        .then(data => {
            portfolioData = data || [];
            saveToStorage();
            if (document.getElementById('portfolio-grid')) {
                renderPortfolio();
            }
            if (document.getElementById('projectList')) {
                renderProjectList();
            }
        })
        .catch(error => {
            console.error('Error load portfolio:', error);
            portfolioData = [];
            saveToStorage();
            if (document.getElementById('portfolio-grid')) renderPortfolio();
            if (document.getElementById('projectList')) renderProjectList();
        });
}

// Render Portfolio Grid di Index.html (Dengan Animasi Fade-In dan Modal Full Page)
function renderPortfolio() {
    const grid = document.getElementById('portfolio-grid');
    if (!grid) return;

    grid.innerHTML = '';
    portfolioData.forEach((project, index) => {
        const card = document.createElement('div');
        card.className = 'portfolio-card';
        card.style.animationDelay = `${index * 0.1}s`;

        // Jika images adalah array, ambil yang pertama sebagai thumbnail
        const images = Array.isArray(project.images) ? project.images : [project.image || ''];
        const thumbnail = images[0] || 'https://via.placeholder.com/300x200?text=No+Image';

        let imgHtml = `
            <a href="#" class="project-link" data-images='${JSON.stringify(images)}' data-title="${project.title}" data-index="0">
                <img src="${thumbnail}" alt="${project.title}" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
            </a>
        `;
        if (project.link) {
            imgHtml += `<a href="${project.link}" target="_blank" class="card-link">Lihat Proyek Lengkap</a>`;
        }

        card.innerHTML = `
            ${imgHtml}
            <div class="card-content">
                <h3 class="card-title">${project.title}</h3>
                <p class="card-desc">${project.description}</p>
            </div>
        `;
        grid.appendChild(card);

        // Trigger fade-in
        const cards = grid.querySelectorAll('.portfolio-card');
        cards.forEach(card => card.classList.add('visible'));
    });

    // Event listener untuk modal (dipanggil setelah render)
    document.querySelectorAll('.project-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const images = JSON.parse(this.getAttribute('data-images'));
            const title = this.getAttribute('data-title');
            openModal(images, title, 0);
        });
    });
}

// Fungsi Open Modal Full Page
function openModal(images, title, startIndex) {
    const modal = document.getElementById('imageModal');
    if (!modal) return;

    let currentIndex = startIndex;

    function showImage(index) {
        const modalImg = document.getElementById('modalImage');
        const caption = document.getElementById('modalCaption');
        if (modalImg) modalImg.src = images[index];
        if (caption) caption.innerHTML = `${title} (${index + 1}/${images.length})`;
        currentIndex = index;
    }

    // Reset modal content
    modal.innerHTML = `
        <span class="close-modal">&times;</span>
        <img class="modal-content" id="modalImage" src="${images[currentIndex]}">
        <div class="modal-caption" id="modalCaption">${title} (${currentIndex + 1}/${images.length})</div>
    `;

    // Navigasi jika multiple images
    if (images.length > 1) {
        modal.innerHTML = `
            <span class="close-modal">&times;</span>
            <div class="modal-gallery">
                <span class="gallery-prev">&lt;</span>
                <img class="modal-content" id="modalImage" src="${images[currentIndex]}">
                <span class="gallery-next">&gt;</span>
            </div>
            <div class="modal-caption" id="modalCaption">${title} (${currentIndex + 1}/${images.length})</div>
        `;

        document.querySelector('.gallery-prev').addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + images.length) % images.length;
            showImage(currentIndex);
        });
        document.querySelector('.gallery-next').addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % images.length;
            showImage(currentIndex);
        });
    }

    modal.style.display = 'flex';

    // Close modal
    document.querySelector('.close-modal').addEventListener('click', () => {
        modal.style.display = 'none';
    });
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
}

// Render Project List di Admin
function renderProjectList() {
    const list = document.getElementById('projectList');
    if (!list) return;

    list.innerHTML = '<h3>Daftar Proyek</h3>';
    if (portfolioData.length === 0) {
        list.innerHTML += '<p style="color: #666666; text-align: center;">Belum ada proyek.</p>';
        return;
    }

    portfolioData.forEach((project, index) => {
        const images = Array.isArray(project.images) ? project.images : [project.image || ''];
        const thumbnail = images[0];
        const item = document.createElement('div');
        item.className = 'project-item';
        item.innerHTML = `
            <img src="${thumbnail}" alt="${project.title}" onerror="this.src='https://via.placeholder.com/50?text=No+Image'" style="width:50px;height:50px;object-fit:cover;border-radius:5px;margin-right:10px;">
            <div style="flex:1;">
                <strong>${project.title}</strong><br>
                <small>${project.description.substring(0, 50)}${project.description.length > 50 ? '...' : ''}</small>
            </div>
            <div>
                ${project.link ? `<a href="${project.link}" target="_blank" class="edit-btn" style="margin-right:5px;">Lihat</a>` : ''}
                <button class="edit-btn" onclick="editProject(${index})" style="margin-right:5px;">Edit</button>
                <button class="delete-btn" onclick="deleteProject(${index})">Hapus</button>
            </div>
        `;
        list.appendChild(item);
    });
}

// Fungsi Hapus Proyek
function deleteProject(index) {
    if (confirm('Yakin hapus proyek ini?')) {
        portfolioData.splice(index, 1);
        saveToStorage();
        renderProjectList();
        exportJson();
        alert('Proyek dihapus! Refresh index.html untuk update otomatis.');
    }
}

// Fungsi Edit Proyek (Sederhana)
function editProject(index) {
    const project = portfolioData[index];
    const newTitle = prompt('Edit Judul:', project.title);
    const newDesc = prompt('Edit Deskripsi:', project.description);
    const newLink = prompt('Edit Link (kosongkan jika tidak ada):', project.link || '');

    if (newTitle !== null && newDesc !== null) {
        portfolioData[index].title = newTitle.trim() || project.title;
        portfolioData[index].description = newDesc.trim() || project.description;
        portfolioData[index].link = newLink.trim() || '';
        saveToStorage();
        renderProjectList();
        exportJson();
        alert('Proyek diupdate! Refresh index.html untuk lihat perubahan.');
    }
}

// Fungsi Export JSON
function exportJson() {
    const dataStr = JSON.stringify(portfolioData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'portfolio.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log('JSON exported - Ganti file di hosting untuk multi-device sync.');
}

// Event Listener Utama (DOMContentLoaded)
document.addEventListener('DOMContentLoaded', function () {
    loadPortfolio();
    if (document.querySelector('.cv-page')) {
        return;
    }

    // HAMBURGER MENU
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function () {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // WHATSAPP FORM
    const contactForm = document.getElementById('contactForm');
    const formFeedback = document.getElementById('formFeedback');
    if (contactForm && formFeedback) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const name = document.getElementById('userName').value.trim();
            const email = document.getElementById('userEmail').value.trim();
            const message = document.getElementById('userMessage').value.trim();

            if (!name || !message) {
                formFeedback.textContent = 'Mohon isi nama dan pesan.';
                formFeedback.className = 'form-feedback error';
                formFeedback.style.display = 'block';
                return;
            }

            let waMessage = `Halo! Nama saya ${name}.`;
            if (email) waMessage += ` Email: ${email}.`;
            waMessage += ` Pesan: ${message}`;

            const encodedMessage = encodeURIComponent(waMessage);
            const whatsappNumber = '628873434754';
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

            formFeedback.textContent = 'Pesan siap dikirim! WhatsApp akan terbuka...';
            formFeedback.className = 'form-feedback success';
            formFeedback.style.display = 'block';

            contactForm.reset();

            window.open(whatsappUrl, '_blank');

            setTimeout(() => {
                formFeedback.style.display = 'none';
            }, 3000);
        });
    }

    // ADMIN LOGIN
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('errorMsg');
    const adminPanel = document.getElementById('adminContent');
    const logoutBtn = document.getElementById('logoutBtn');

    if (loginForm) {
        if (localStorage.getItem('loggedIn') === 'true') {
            if (adminPanel) adminPanel.style.display = 'block';
            document.getElementById('loginSection').style.display = 'none';
            loadPortfolio();
        }

        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();

            const adminUsername = 'adminyogga';
            const adminPassword = '010101';

            if (username === adminUsername && password === adminPassword) {
                localStorage.setItem('loggedIn', 'true');
                if (adminPanel) adminPanel.style.display = 'block';
                document.getElementById('loginSection').style.display = 'none';
                if (loginError) loginError.style.display = 'none';
                loadPortfolio();
            } else {
                if (loginError) {
                    loginError.textContent = 'Username atau password salah!';
                    loginError.style.display = 'block';
                }
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            localStorage.removeItem('loggedIn');
            if (adminPanel) adminPanel.style.display = 'none';
            document.getElementById('loginSection').style.display = 'flex';
            portfolioData = [];
            location.reload();
        });
    }

    // ADMIN FORM TAMBAH PROYEK DENGAN DRAG & DROP (Multiple Images)
    const portfolioForm = document.getElementById('addProjectForm');
    const formMessage = document.getElementById('addError');
    const dragZone = document.getElementById('dragDropZone');
    const fileInput = document.getElementById('imageInput');
    const preview = document.getElementById('imagePreview');
    const removeBtn = document.getElementById('removeImages');
    let selectedImages = [];  // Array untuk multiple images

    if (portfolioForm && dragZone && fileInput) {
        // Drag & Drop Events
        dragZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dragZone.classList.add('drag-over');
        });

        dragZone.addEventListener('dragleave', () => {
            dragZone.classList.remove('drag-over');
        });

        dragZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dragZone.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) handleFile(files);
        });

        // Click Fallback
        dragZone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) handleFile(e.target.files);
        });

        // Hapus Gambar
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                selectedImages = [];
                if (preview) preview.style.display = 'none';
                fileInput.value = '';
                const hintP = dragZone.querySelector('p');
                if (hintP) hintP.style.display = 'block';
            });
        }

        // Handle File Upload (Multiple)
        function handleFile(files) {
            selectedImages = [];
            Array.from(files).forEach(file => {
                if (!file.type.startsWith('image/')) {
                    alert('Hanya file gambar (JPG, PNG, GIF) yang diizinkan!');
                    return;
                }
                if (file.size > 5 * 1024 * 1024) {
                    alert('File terlalu besar! Maksimal 5MB per gambar.');
                    return;
                }
                const reader = new FileReader();
                reader.onload = (e) => {
                    selectedImages.push(e.target.result);
                    updatePreview();
                };
                reader.readAsDataURL(file);
            });
        }

        // Update Preview
        function updatePreview() {
            const container = document.getElementById('previewContainer');
            if (container) {
                container.innerHTML = '';
                selectedImages.forEach((src) => {
                    const img = document.createElement('img');
                    img.src = src;
                    img.style.width = '100px';
                    img.style.margin = '5px';
                    container.appendChild(img);
                });
                if (selectedImages.length > 0) {
                    document.getElementById('imagePreview').style.display = 'block';
                }
            }
        }

        // Submit Form Tambah Proyek
        portfolioForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('projectTitle').value.trim();
            const desc = document.getElementById('projectDesc').value.trim();
            const link = document.getElementById('projectLink') ? document.getElementById('projectLink').value.trim() : '';

            if (!title || !desc || selectedImages.length === 0) {
                if (formMessage) {
                    formMessage.textContent = 'Mohon isi semua field dan pilih gambar!';
                    formMessage.className = 'error';
                    formMessage.style.display = 'block';
                }
                return;
            }

            const newProject = {
                title,
                description: desc,
                images: selectedImages,
                link: link || ''
            };

            portfolioData.unshift(newProject);
            saveToStorage();
            exportJson();

            // Reset Form
            portfolioForm.reset();
            selectedImages = [];
            if (preview) preview.style.display = 'none';
            fileInput.value = '';
            const hintP = dragZone.querySelector('p');
            if (hintP) hintP.style.display = 'block';

            if (formMessage) {
                formMessage.textContent = 'Proyek berhasil ditambahkan! Refresh index.html untuk lihat update otomatis.';
                formMessage.className = 'success';
                formMessage.style.display = 'block';
                setTimeout(() => {
                    formMessage.style.display = 'none';
                }, 3000);
            }

            // Refresh list proyek di admin
            renderProjectList();
        });
    }

    // EXPORT JSON BUTTON
        const exportBtn = document.getElementById('exportJsonBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', function () {
                exportJson();
                alert('portfolio.json berhasil diunduh! Ganti file di hosting untuk sync multi-device.');
            });
        }
    });