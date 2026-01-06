/**
 * Cash Flow Command System - Core Logic
 */

const app = {
    data: {
        cashBalance: 0,
        invoices: [], // { id, client, amount, dateSent, dueDate, status: 'Sent'|'Paid'|'Overdue' }
        bills: [],    // { id, vendor, amount, dueDate, status: 'Unpaid'|'Paid', priority, category }
        recurringTemplates: [] // { id, type: 'invoice'|'bill', name, amount, frequency: 'weekly'|'monthly'|'quarterly', startDate, active }
    },

    init() {
        this.loadData();
        this.loadTheme();
        this.processRecurringTemplates();
        this.renderDashboard();
        this.renderAR();
        this.renderAP();
        this.renderCashFlowChart();
        this.renderTemplates();
        console.log("System Initialized");
    },

    // --- Theme Management ---
    loadTheme() {
        const theme = localStorage.getItem('theme') || 'light';
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            document.getElementById('theme-icon').textContent = '☀️';
            document.getElementById('theme-text').textContent = 'Light Mode';
        }
    },

    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');

        document.getElementById('theme-icon').textContent = isDark ? '☀️' : '🌙';
        document.getElementById('theme-text').textContent = isDark ? 'Light Mode' : 'Dark Mode';

        // Re-render chart with new theme
        if (this.cashFlowChart) {
            this.cashFlowChart.destroy();
            this.renderCashFlowChart();
        }
    },

    // --- Persistence ---
    loadData() {
        const stored = localStorage.getItem('cashFlowData');
        if (stored) {
            this.data = JSON.parse(stored);
        } else {
            // Seed Mock Data for first run
            this.data.cashBalance = 15000;
            this.data.invoices = [
                { id: 'INV-001', client: 'Acme Corp', amount: 5000, dateSent: '2025-01-01', dueDate: '2025-01-15', status: 'Sent' },
                { id: 'INV-002', client: 'Globex', amount: 3200, dateSent: '2024-12-25', dueDate: '2025-01-05', status: 'Overdue' }
            ];
            this.data.bills = [
                { id: 'BILL-101', vendor: 'AWS', amount: 450, dueDate: '2025-01-10', status: 'Unpaid' }
            ];
            this.saveData();
        }
    },

    saveData() {
        localStorage.setItem('cashFlowData', JSON.stringify(this.data));
        this.renderAll();
    },

    // --- Data Management ---
    exportData() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cashflow_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        this.showToast('Data exported successfully', 'success');
    },

    importData(input) {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                // Basic validation
                if (imported.cashBalance !== undefined && Array.isArray(imported.invoices)) {
                    this.data = imported;
                    this.saveData();
                    this.showToast('Data imported successfully', 'success');
                } else {
                    this.showToast('Invalid file format', 'info');
                }
            } catch (err) {
                this.showToast('Error reading file', 'info');
                console.error(err);
            }
        };
        reader.readAsText(file);
        input.value = ''; // Reset input
    },

    importCSV(input) {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csv = e.target.result;
                const lines = csv.split('\n').filter(line => line.trim());

                if (lines.length < 2) {
                    this.showToast('CSV file is empty or invalid', 'info');
                    return;
                }

                // Parse CSV (assuming format: Date, Description, Amount, Type)
                // Skip header row
                let imported = 0;
                for (let i = 1; i < lines.length; i++) {
                    const parts = lines[i].split(',').map(p => p.trim().replace(/"/g, ''));

                    if (parts.length < 4) continue;

                    const [date, description, amount, type] = parts;
                    const parsedAmount = Math.abs(parseFloat(amount));

                    if (isNaN(parsedAmount)) continue;

                    // Auto-categorize based on type or amount sign
                    if (type.toLowerCase().includes('credit') || parseFloat(amount) > 0) {
                        // Income - create invoice
                        this.data.invoices.push({
                            id: this.generateId('INV'),
                            client: description,
                            amount: parsedAmount,
                            dateSent: date,
                            dueDate: date,
                            status: 'Paid'
                        });
                        imported++;
                    } else {
                        // Expense - create bill
                        this.data.bills.push({
                            id: this.generateId('BILL'),
                            vendor: description,
                            amount: parsedAmount,
                            dueDate: date,
                            priority: 'Medium',
                            status: 'Paid'
                        });
                        imported++;
                    }
                }

                this.saveData();
                // Re-render chart with new data
                if (this.cashFlowChart) {
                    this.cashFlowChart.destroy();
                }
                this.renderCashFlowChart();
                this.showToast(`Imported ${imported} transactions from CSV`, 'success');
            } catch (err) {
                this.showToast('Error parsing CSV file', 'info');
                console.error(err);
            }
        };
        reader.readAsText(file);
        input.value = ''; // Reset input
    },

    // --- Navigation ---
    navigate(viewName) {
        // Hide all views
        document.querySelectorAll('.view-section').forEach(el => {
            el.classList.add('hidden');
            el.classList.remove('fade-in');
        });

        // Show target view with animation
        const target = document.getElementById(`view-${viewName}`);
        target.classList.remove('hidden');
        void target.offsetWidth; // Trigger reflow to restart animation
        target.classList.add('fade-in');

        // Update Sidebar Active State
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        // Handle case where function is called programmatically without event
        if (event && event.currentTarget) {
            event.currentTarget.classList.add('active');
        }
    },

    // --- Modals ---
    openModal(modalId) {
        if (!modalId.startsWith('modal-')) modalId = `modal-${modalId}`;
        const modal = document.getElementById(modalId);
        if (modal) {
            document.getElementById('modal-overlay').classList.remove('hidden');
            modal.classList.remove('hidden');
        } else {
            alert(`Modal ${modalId} not found.`);
        }
    },

    closeModal() {
        document.getElementById('modal-overlay').classList.add('hidden');
        document.querySelectorAll('.modal').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('form').forEach(form => form.reset());
    },

    // --- Actions ---
    handleAddInvoice(event) {
        event.preventDefault();
        const formData = new FormData(event.target);

        const newInvoice = {
            id: this.generateId('INV'),
            client: formData.get('client'),
            amount: parseFloat(formData.get('amount')),
            dateSent: formData.get('dateSent'),
            dueDate: formData.get('dueDate'),
            status: 'Sent'
        };

        this.data.invoices.push(newInvoice);
        this.saveData();
        this.closeModal();
        this.renderAR();
        this.renderDashboard();
    },

    handleAddBill(event) {
        event.preventDefault();
        const formData = new FormData(event.target);

        const newBill = {
            id: this.generateId('BILL'),
            vendor: formData.get('vendor'),
            amount: parseFloat(formData.get('amount')),
            dueDate: formData.get('dueDate'),
            status: 'Unpaid'
        };

        this.data.bills.push(newBill);
        this.saveData();
        this.closeModal();
        this.renderAP();
        this.renderDashboard();
    },

    handleDecision(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const expense = parseFloat(formData.get('amount'));

        const totalAP = this.data.bills.reduce((sum, b) => sum + b.amount, 0); // Total outstanding liabilities
        const weeklyBurn = (totalAP / 4) || 1000;

        const currentCash = this.data.cashBalance;
        const newCash = currentCash - expense;

        const currentRunway = (currentCash / weeklyBurn).toFixed(1);
        const newRunway = (newCash / weeklyBurn).toFixed(1);

        const resultEl = document.getElementById('decision-result');

        if (newCash < 0) {
            resultEl.innerHTML = `<span style="color: var(--danger)">❌ <strong>NO GO:</strong> This would put you in negative cash flow (-$${Math.abs(newCash).toFixed(2)}).</span>`;
        } else if (newRunway < 4) {
            resultEl.innerHTML = `<span style="color: var(--warning)">⚠️ <strong>RISKY:</strong> Runway drops from ${currentRunway} to ${newRunway} weeks. Only approve if critical.</span>`;
        } else {
            resultEl.innerHTML = `<span style="color: var(--success)">✅ <strong>APPROVED:</strong> New runway is ${newRunway} weeks (Healthy).</span>`;
        }
    },

    handleUpdateCash(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        this.data.cashBalance = parseFloat(formData.get('balance'));
        this.saveData();
        this.closeModal();
        this.renderDashboard();
    },

    generateId(prefix) {
        return `${prefix}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    },

    // --- Review Wizard ---
    reviewNext(currentStep) {
        // Validation/Action per step
        if (currentStep === 1) {
            const balanceInput = document.getElementById('review-balance-input');
            if (balanceInput.value === '') {
                alert("Please enter a balance.");
                return;
            }
            this.data.cashBalance = parseFloat(balanceInput.value);
            this.saveData(); // Save step 1 immediately
        }

        // Logic for next step
        const nextStep = currentStep + 1;

        // Render specific step content
        if (nextStep === 2) this.renderReviewAR();
        if (nextStep === 3) this.renderReviewAP();
        if (nextStep === 4) this.renderReviewForecast();

        // UI Update
        document.getElementById(`step-${currentStep}`).classList.remove('active');
        document.getElementById(`step-${nextStep}`).classList.add('active');

        document.getElementById(`step-ind-${currentStep}`).classList.add('completed');
        document.getElementById(`step-ind-${currentStep}`).classList.remove('active');
        document.getElementById(`step-ind-${nextStep}`).classList.add('active');
    },

    reviewPrev(currentStep) {
        const prevStep = currentStep - 1;
        // UI Update
        document.getElementById(`step-${currentStep}`).classList.remove('active');
        document.getElementById(`step-${prevStep}`).classList.add('active');

        document.getElementById(`step-ind-${currentStep}`).classList.remove('active');
        document.getElementById(`step-ind-${prevStep}`).classList.remove('completed');
        document.getElementById(`step-ind-${prevStep}`).classList.add('active');
    },

    renderReviewAR() {
        const container = document.getElementById('review-ar-list');
        const overdue = this.data.invoices.filter(i => i.status === 'Overdue' || i.status === 'Sent');

        if (overdue.length === 0) {
            container.innerHTML = '<div style="color: var(--success); font-size: 1.2rem;">🎉 No outstanding invoices!</div>';
            return;
        }

        let html = '<table style="width: 100%; text-align: left;">';
        overdue.forEach(inv => {
            html += `
                <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 0.5rem;">${inv.client}</td>
                    <td style="padding: 0.5rem;">${this.formatCurrency(inv.amount)}</td>
                    <td style="padding: 0.5rem;"><button class="btn btn-sm" onclick="app.sendReminder('${inv.id}')">📧 Remind</button></td>
                </tr>
            `;
        });
        html += '</table>';
        container.innerHTML = html;
    },

    renderReviewAP() {
        const container = document.getElementById('review-ap-list');
        // Filter bills due in next 7 days or overdue
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        const urgentBills = this.data.bills.filter(b => {
            const d = new Date(b.dueDate);
            return b.status !== 'Paid' && d <= nextWeek;
        });

        if (urgentBills.length === 0) {
            container.innerHTML = '<div style="color: var(--success); font-size: 1.2rem;">✨ No urgent bills this week.</div>';
            return;
        }

        let html = '<table style="width: 100%; text-align: left;">';
        urgentBills.forEach(bill => {
            html += `
                <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 0.5rem;">${bill.vendor}</td>
                    <td style="padding: 0.5rem;">${this.formatCurrency(bill.amount)}</td>
                    <td style="padding: 0.5rem;">${bill.dueDate}</td>
                </tr>
            `;
        });
        html += '</table>';
        container.innerHTML = html;
    },

    renderReviewForecast() {
        // Re-use logic from renderDashboard mostly, but simplify
        const totalAR = this.data.invoices.filter(i => i.status !== 'Paid').reduce((sum, i) => sum + i.amount, 0);
        const totalAP = this.data.bills.filter(b => b.status !== 'Paid').reduce((sum, b) => sum + b.amount, 0);

        const container = document.getElementById('review-forecast-preview');
        container.innerHTML = `
            <div style="display: flex; justify-content: space-around; font-size: 1.2rem; margin-bottom: 1rem;">
                <div>Cash: <strong>${this.formatCurrency(this.data.cashBalance)}</strong></div>
                <div>Net AR: <strong>${this.formatCurrency(totalAR)}</strong></div>
                <div>Net AP: <strong>${this.formatCurrency(totalAP)}</strong></div>
            </div>
        `;

        const statusEl = document.getElementById('review-health-status');
        if (this.data.cashBalance + totalAR > totalAP) {
            statusEl.innerHTML = `<span style="color: var(--success)">✅ Outlook is Healthy</span>`;
        } else {
            statusEl.innerHTML = `<span style="color: var(--danger)">⚠️ Cash Crunch Possible</span>`;
        }
    },

    finishReview() {
        this.showToast("Weekly Review Complete! Great job.", "success");
        this.navigate('dashboard');
        // Reset Wizard UI for next time
        setTimeout(() => {
            document.querySelectorAll('.wizard-step').forEach(el => el.classList.remove('active'));
            document.getElementById('step-1').classList.add('active');
            document.querySelectorAll('.progress-step').forEach(el => {
                el.classList.remove('active', 'completed');
            });
            document.getElementById('step-ind-1').classList.add('active');
            document.getElementById('review-balance-input').value = '';
        }, 1000);
    },

    // --- Rendering ---
    renderAll() {
        this.renderDashboard();
        this.renderAR();
        this.renderAP();
        this.renderForecast();

        // Populate Review Input Initial Value
        const balInput = document.getElementById('review-balance-input');
        if (balInput) balInput.value = this.data.cashBalance;
    },

    renderDashboard() {
        // 1. Calculate KPIs
        const totalAR = this.data.invoices
            .filter(i => i.status !== 'Paid')
            .reduce((sum, i) => sum + i.amount, 0);

        const totalAP = this.data.bills
            .filter(b => b.status !== 'Paid')
            .reduce((sum, b) => sum + b.amount, 0);

        // Update DOM
        document.getElementById('kpi-cash').innerText = this.formatCurrency(this.data.cashBalance);
        document.getElementById('kpi-in').innerText = this.formatCurrency(totalAR);
        document.getElementById('kpi-out').innerText = this.formatCurrency(totalAP);

        // Simple Runway logic
        const weeklyBurn = totalAP / 4 || 1000;
        const runway = (this.data.cashBalance / weeklyBurn).toFixed(1);
        document.getElementById('kpi-runway').innerText = `${runway} Weeks`;

        // Alerts - Updated logic for "Bills due this week"
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        const overdueInvoices = this.data.invoices.filter(i => i.status === 'Overdue').length;
        const billsDueSoon = this.data.bills.filter(b => {
            const d = new Date(b.dueDate);
            return b.status !== 'Paid' && d >= today && d <= nextWeek;
        }).length;

        const alertBox = document.getElementById('dashboard-alerts');
        const alertMsg = document.getElementById('alert-message');

        if (overdueInvoices > 0) {
            alertBox.classList.remove('hidden');
            alertMsg.innerHTML = `You have <strong>${overdueInvoices} overdue invoice(s)</strong> needing attention.`;
        } else if (billsDueSoon > 0) {
            alertBox.classList.remove('hidden');
            alertMsg.innerHTML = `<strong>${billsDueSoon} bill(s)</strong> are due in the next 7 days.`;
        } else if (runway < 4) {
            alertBox.classList.remove('hidden');
            alertMsg.innerHTML = `Cash Runway is low <strong>(${runway} weeks)</strong>. Review expenses immediately.`;
        } else {
            alertBox.classList.add('hidden');
        }

        this.renderForecast();
    },

    renderForecast() {
        const tbody = document.getElementById('forecast-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        let currentBalance = this.data.cashBalance;
        const today = new Date();

        for (let i = 0; i < 12; i++) {
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() + (i * 7));
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);

            // Filter transactions for this week
            const weeklyIn = this.data.invoices
                .filter(inv => {
                    const d = new Date(inv.dueDate);
                    return inv.status !== 'Paid' && d >= startOfWeek && d <= endOfWeek;
                })
                .reduce((sum, inv) => sum + inv.amount, 0);

            const weeklyOut = this.data.bills
                .filter(bill => {
                    const d = new Date(bill.dueDate);
                    return bill.status !== 'Paid' && d >= startOfWeek && d <= endOfWeek;
                })
                .reduce((sum, bill) => sum + bill.amount, 0);

            const netChange = weeklyIn - weeklyOut;
            currentBalance += netChange;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>Week ${i + 1} <span style="font-size: 0.75rem; color: #9ca3af">(${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()})</span></td>
                <td style="color: var(--success)">+${this.formatCurrency(weeklyIn)}</td>
                <td style="color: var(--danger)">-${this.formatCurrency(weeklyOut)}</td>
                <td style="font-weight: 600; color: ${netChange >= 0 ? 'var(--success)' : 'var(--danger)'}">${netChange >= 0 ? '+' : ''}${this.formatCurrency(netChange)}</td>
                <td style="font-weight: 700">${this.formatCurrency(currentBalance)}</td>
            `;
            tbody.appendChild(tr);
        }
    },

    renderAR() {
        const tbody = document.getElementById('ar-table-body');
        tbody.innerHTML = '';

        const today = new Date();

        this.data.invoices.forEach(inv => {
            // Dynamic Status Calculation
            const dueDate = new Date(inv.dueDate);
            const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

            // Auto-update status if not paid and overdue
            if (inv.status !== 'Paid' && daysOverdue > 0) {
                inv.status = 'Overdue';
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${inv.id}</td>
                <td>${inv.client}</td>
                <td>${inv.dateSent}</td>
                <td>${inv.dueDate}</td>
                <td>${this.formatCurrency(inv.amount)}</td>
                <td>
                    <span class="badge badge-${inv.status === 'Paid' ? 'paid' : inv.status === 'Overdue' ? 'overdue' : 'pending'}">${inv.status}</span>
                    ${inv.status === 'Overdue' ? `<span style="color: var(--danger); font-size: 0.75rem; margin-left: 0.5rem;">(${daysOverdue} days)</span>` : ''}
                </td>
                <td style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-sm" onclick="app.sendReminder('${inv.id}')" title="Send Reminder">📩</button>
                    <button class="btn btn-sm" onclick="app.markInvoicePaid('${inv.id}')" title="Mark Paid">💵</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    markInvoicePaid(id) {
        const inv = this.data.invoices.find(i => i.id === id);
        if (inv) {
            inv.status = 'Paid';
            this.saveData();
        }
    },

    renderAP() {
        const tbody = document.getElementById('ap-table-body');
        tbody.innerHTML = '';

        this.data.bills.forEach(bill => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${bill.id}</td>
                <td>${bill.vendor}</td>
                <td>${bill.dueDate}</td>
                <td>${this.formatCurrency(bill.amount)}</td>
                <td><span class="badge" style="background: ${bill.priority === 'High' ? '#fee2e2; color: #ef4444' : bill.priority === 'Medium' ? '#fef3c7; color: #f59e0b' : '#d1fae5; color: #10b981'}">${bill.priority || 'Medium'}</span></td>
                <td><span class="badge badge-${bill.status === 'Paid' ? 'paid' : 'pending'}">${bill.status}</span></td>
                <td><button class="btn btn-sm">Pay</button></td>
            `;
            tbody.appendChild(tr);
        });
    },

    // --- Utilities ---
    formatCurrency(num) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<span>${type === 'success' ? '✅' : 'ℹ️'}</span> ${message}`;

        container.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // --- Actions ---
    sendReminder(id) {
        const inv = this.data.invoices.find(i => i.id === id);
        if (inv) {
            const subject = encodeURIComponent(`Invoice ${inv.id} Overdue`);
            const body = encodeURIComponent(`Dear ${inv.client},\n\nThis is a friendly reminder that invoice ${inv.id} for ${this.formatCurrency(inv.amount)} was due on ${inv.dueDate}.\n\nPlease remit payment at your earliest convenience.\n\nThank you.`);

            window.open(`mailto:?subject=${subject}&body=${body}`);
            this.showToast('Opened email client for reminder', 'info');
        }
    },

    resetDemo() {
        if (confirm("Reset all data to default demo state? This cannot be undone.")) {
            localStorage.removeItem('cashFlowData');
            location.reload();
        }
    },

    // --- Data Visualization ---
    renderCashFlowChart() {
        const ctx = document.getElementById('cashflow-chart');
        if (!ctx) return;

        const isDark = document.body.classList.contains('dark-mode');
        const textColor = isDark ? '#f1f5f9' : '#1f2937';
        const gridColor = isDark ? '#334155' : '#e5e7eb';

        // Calculate actual historical data (last 8 weeks)
        const labels = [];
        const cashData = [];
        const arData = [];
        const apData = [];

        let runningCash = this.data.cashBalance;

        for (let i = 7; i >= 0; i--) {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - (i * 7));
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);

            labels.push(weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

            // Calculate AR (paid invoices) in this week
            const weekAR = this.data.invoices
                .filter(inv => {
                    if (inv.status !== 'Paid') return false;
                    const paidDate = new Date(inv.dueDate); // Assuming paid on due date
                    return paidDate >= weekStart && paidDate <= weekEnd;
                })
                .reduce((sum, inv) => sum + inv.amount, 0);

            // Calculate AP (paid bills) in this week
            const weekAP = this.data.bills
                .filter(bill => {
                    if (bill.status !== 'Paid') return false;
                    const paidDate = new Date(bill.dueDate); // Assuming paid on due date
                    return paidDate >= weekStart && paidDate <= weekEnd;
                })
                .reduce((sum, bill) => sum + bill.amount, 0);

            arData.push(weekAR);
            apData.push(weekAP);

            // Calculate running cash balance
            runningCash = runningCash + weekAR - weekAP;
            cashData.push(runningCash);
        }

        // If no historical data, show current balance as baseline
        if (cashData.every(val => val === this.data.cashBalance)) {
            for (let i = 0; i < 8; i++) {
                cashData[i] = this.data.cashBalance;
            }
        }

        this.cashFlowChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Cash Balance',
                        data: cashData,
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'AR (Money In)',
                        data: arData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: false
                    },
                    {
                        label: 'AP (Money Out)',
                        data: apData,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.4,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: {
                            color: textColor,
                            font: { family: 'Inter' }
                        }
                    },
                    tooltip: {
                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                        titleColor: textColor,
                        bodyColor: textColor,
                        borderColor: gridColor,
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: textColor,
                            callback: function (value) {
                                return '$' + value.toLocaleString();
                            }
                        },
                        grid: {
                            color: gridColor
                        }
                    },
                    x: {
                        ticks: {
                            color: textColor
                        },
                        grid: {
                            color: gridColor
                        }
                    }
                }
            }
        });
    },

    // --- Recurring Templates ---
    handleAddTemplate(event) {
        event.preventDefault();
        const formData = new FormData(event.target);

        const newTemplate = {
            id: this.generateId('TPL'),
            type: formData.get('type'),
            name: formData.get('name'),
            amount: parseFloat(formData.get('amount')),
            frequency: formData.get('frequency'),
            startDate: formData.get('startDate'),
            active: true
        };

        this.data.recurringTemplates.push(newTemplate);
        this.saveData();
        this.closeModal();
        this.renderTemplates();
        this.showToast('Template created successfully', 'success');
    },

    renderTemplates() {
        const invoiceList = document.getElementById('invoice-templates-list');
        const billList = document.getElementById('bill-templates-list');

        if (!invoiceList || !billList) return;

        const invoiceTemplates = this.data.recurringTemplates.filter(t => t.type === 'invoice');
        const billTemplates = this.data.recurringTemplates.filter(t => t.type === 'bill');

        // Render invoice templates
        if (invoiceTemplates.length === 0) {
            invoiceList.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">No recurring invoices yet</p>';
        } else {
            invoiceList.innerHTML = invoiceTemplates.map(t => `
                <div class="card" style="margin-bottom: 1rem; padding: 1rem; background: var(--light);">
                    <div class="flex-between">
                        <div>
                            <strong>${t.name}</strong>
                            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">
                                ${this.formatCurrency(t.amount)} • ${t.frequency}
                            </div>
                        </div>
                        <button class="btn btn-sm" onclick="app.deleteTemplate('${t.id}')" style="background: var(--danger); color: white;">Delete</button>
                    </div>
                </div>
            `).join('');
        }

        // Render bill templates
        if (billTemplates.length === 0) {
            billList.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">No recurring bills yet</p>';
        } else {
            billList.innerHTML = billTemplates.map(t => `
                <div class="card" style="margin-bottom: 1rem; padding: 1rem; background: var(--light);">
                    <div class="flex-between">
                        <div>
                            <strong>${t.name}</strong>
                            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">
                                ${this.formatCurrency(t.amount)} • ${t.frequency}
                            </div>
                        </div>
                        <button class="btn btn-sm" onclick="app.deleteTemplate('${t.id}')" style="background: var(--danger); color: white;">Delete</button>
                    </div>
                </div>
            `).join('');
        }
    },

    deleteTemplate(id) {
        if (confirm('Delete this template? This will not affect existing transactions.')) {
            this.data.recurringTemplates = this.data.recurringTemplates.filter(t => t.id !== id);
            this.saveData();
            this.renderTemplates();
            this.showToast('Template deleted', 'info');
        }
    },

    // Generate transactions from templates (called on init)
    processRecurringTemplates() {
        const today = new Date();

        this.data.recurringTemplates.forEach(template => {
            if (!template.active) return;

            const startDate = new Date(template.startDate);
            if (startDate > today) return; // Not started yet

            // Calculate next occurrence
            const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
            let intervalDays;

            switch (template.frequency) {
                case 'weekly': intervalDays = 7; break;
                case 'monthly': intervalDays = 30; break;
                case 'quarterly': intervalDays = 90; break;
            }

            const occurrences = Math.floor(daysSinceStart / intervalDays);
            const nextDate = new Date(startDate);
            nextDate.setDate(startDate.getDate() + (occurrences + 1) * intervalDays);

            // Check if we need to generate a transaction for next occurrence
            const existingId = `${template.id}-${occurrences + 1}`;

            if (template.type === 'invoice') {
                const exists = this.data.invoices.some(inv => inv.id === existingId);
                if (!exists && nextDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) {
                    this.data.invoices.push({
                        id: existingId,
                        client: template.name,
                        amount: template.amount,
                        dateSent: today.toISOString().split('T')[0],
                        dueDate: nextDate.toISOString().split('T')[0],
                        status: 'Sent'
                    });
                }
            } else {
                const exists = this.data.bills.some(bill => bill.id === existingId);
                if (!exists && nextDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) {
                    this.data.bills.push({
                        id: existingId,
                        vendor: template.name,
                        amount: template.amount,
                        dueDate: nextDate.toISOString().split('T')[0],
                        priority: 'High',
                        status: 'Unpaid'
                    });
                }
            }
        });
    }
};

// Start App
document.addEventListener('DOMContentLoaded', () => app.init());
