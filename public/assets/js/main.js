/* main.js - read month inputs and initialize Chart.js bar chart */
(function () {
	const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

	function idPrefix(month) {
		return month.slice(0,3).toLowerCase();
	}

	function toNumber(v) {
		const n = parseFloat(v);
		return Number.isFinite(n) ? n : 0;
	}

	function readMonthValues() {
		const incomes = [];
		const expenses = [];
		const byMonth = {};

		months.forEach(m => {
			const p = idPrefix(m);
			const incomeEl = document.getElementById(`${p}-income`);
			const expenseEl = document.getElementById(`${p}-expenses`);
			const income = incomeEl ? toNumber(incomeEl.value) : 0;
			const expense = expenseEl ? toNumber(expenseEl.value) : 0;

			incomes.push(income);
			expenses.push(expense);
			byMonth[m] = { income, expenses: expense };
		});

		return { months, incomes, expenses, byMonth };
	}

	// make available globally if other scripts want it
	window.readMonthValues = readMonthValues;

	let monthlyChart = null;

	function createOrUpdateChart() {
		const canvas = document.getElementById('monthlyChart');
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		const { months: labels, incomes, expenses } = readMonthValues();

		const data = {
			labels,
			datasets: [
				{
					label: 'Income',
					data: incomes,
					backgroundColor: 'rgba(40, 167, 69, 0.85)',
					borderColor: 'rgba(40, 167, 69, 1)',
					borderWidth: 1
				},
				{
					label: 'Expenses',
					data: expenses,
					backgroundColor: 'rgba(220, 53, 69, 0.85)',
					borderColor: 'rgba(220, 53, 69, 1)',
					borderWidth: 1
				}
			]
		};

		const options = {
			responsive: true,
			maintainAspectRatio: false,
			scales: { y: { beginAtZero: true } },
			interaction: { mode: 'index', intersect: false }
		};

		if (monthlyChart) {
			monthlyChart.data = data;
			monthlyChart.options = options;
			monthlyChart.update();
		} else {
			monthlyChart = new Chart(ctx, { type: 'bar', data, options });
		}
	}

	document.addEventListener('DOMContentLoaded', () => {
		// Create chart when Chart tab is shown
		const chartTabBtn = document.getElementById('chart-tab');
		if (chartTabBtn) {
			chartTabBtn.addEventListener('shown.bs.tab', () => {
				setTimeout(createOrUpdateChart, 50);
			});
		}

		// Live update when inputs change
		document.querySelectorAll('input[id$="-income"], input[id$="-expenses"]').forEach(input => {
			input.addEventListener('input', () => {
				if (monthlyChart) createOrUpdateChart();
			});
		});

		// If chart pane active at load, draw immediately
		const chartPane = document.getElementById('chart');
		if (chartPane && (chartPane.classList.contains('show') || chartPane.classList.contains('active'))) {
			createOrUpdateChart();
		}

			// Download helpers -------------------------------------------------
			function downloadCanvasAsPNG(canvas, filename = 'chart.png') {
				if (!canvas) return;
				// prefer toBlob
				if (canvas.toBlob) {
					canvas.toBlob(blob => {
						if (!blob) return;
						const url = URL.createObjectURL(blob);
						const a = document.createElement('a');
						a.href = url;
						a.download = filename;
						document.body.appendChild(a);
						a.click();
						a.remove();
						URL.revokeObjectURL(url);
					}, 'image/png');
					return;
				}
				// fallback toDataURL
				const dataUrl = canvas.toDataURL('image/png');
				const a = document.createElement('a');
				a.href = dataUrl;
				a.download = filename;
				document.body.appendChild(a);
				a.click();
				a.remove();
			}

			function downloadCanvasWithBackground(canvas, filename = 'chart.png', backgroundColor = '#fff') {
				if (!canvas) return;
				const w = canvas.width;
				const h = canvas.height;
				const tmp = document.createElement('canvas');
				tmp.width = w;
				tmp.height = h;
				const ctx = tmp.getContext('2d');
				ctx.fillStyle = backgroundColor;
				ctx.fillRect(0, 0, w, h);
				ctx.drawImage(canvas, 0, 0);
				downloadCanvasAsPNG(tmp, filename);
			}

			// Wire up Download button if present
			const downloadBtn = document.getElementById('downloadChart') || document.getElementById('downloadChartBtn');
			if (downloadBtn) {
				downloadBtn.addEventListener('click', () => {
					// ensure chart is up-to-date
					createOrUpdateChart();
					const canvas = document.getElementById('monthlyChart');
					// use white background to avoid transparency
					downloadCanvasWithBackground(canvas, 'bucks2bar-monthly.png', '#ffffff');
				});
			}
    
				// Username validation: expose and optionally wire to #username input
				// Rules: at least 8 chars, at least one uppercase, at least one special character
				function validateUsername(username) {
					if (typeof username !== 'string') return { valid: false, reason: 'Username must be a string' };
					const minLen = 8;
					const hasMin = username.length >= minLen;
					const hasUpper = /[A-Z]/.test(username);
					// special characters: anything not alphanumeric (you can adjust the set)
					const hasSpecial = /[^A-Za-z0-9]/.test(username);

					if (!hasMin) return { valid: false, reason: `Must be at least ${minLen} characters long` };
					if (!hasUpper) return { valid: false, reason: 'Must contain at least one uppercase letter' };
					if (!hasSpecial) return { valid: false, reason: 'Must contain at least one special character (e.g. !@#$%)' };
					return { valid: true };
				}

				// expose globally
				window.validateUsername = validateUsername;

				// If there's an input with id="username", wire live validation
				const usernameInput = document.getElementById('username');
				const usernameFeedback = document.getElementById('usernameFeedback');
				if (usernameInput) {
					const validateAndShow = () => {
						const res = validateUsername(usernameInput.value || '');
						if (res.valid) {
							usernameInput.classList.remove('is-invalid');
							usernameInput.classList.add('is-valid');
							if (usernameFeedback) {
								usernameFeedback.classList.remove('text-danger');
								usernameFeedback.classList.add('text-success');
								usernameFeedback.textContent = 'Looks good.';
							}
						} else {
							usernameInput.classList.remove('is-valid');
							usernameInput.classList.add('is-invalid');
							if (usernameFeedback) {
								usernameFeedback.classList.remove('text-success');
								usernameFeedback.classList.add('text-danger');
								usernameFeedback.textContent = res.reason || 'Invalid username';
							}
						}
					};

					// run initially and on input
					validateAndShow();
					usernameInput.addEventListener('input', validateAndShow);
				}
	});
})();