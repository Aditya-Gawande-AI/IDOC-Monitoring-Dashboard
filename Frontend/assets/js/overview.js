// overview.js
// This script initializes the Chart.js chart for the overview page after the DOM is loaded.


// Wait for both Chart.js and the canvas to be available, then initialize the chart
(function initOverviewChart(retry) {
    retry = retry || 0;
    var chartCanvas = document.getElementById('trendChart');
    if (window.Chart && chartCanvas) {
        var ctx = chartCanvas.getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [
                    {
                        label: 'Success',
                        data: [140, 145, 155, 160, 158, 135, 138],
                        borderColor: '#1a237e',
                        backgroundColor: 'rgba(26,35,126,0.08)',
                        tension: 0.4,
                        pointRadius: 3,
                        pointBackgroundColor: '#fff',
                        pointBorderWidth: 2,
                        borderWidth: 2,
                        fill: false
                    },
                    {
                        label: 'Failure',
                        data: [5, 5, 5, 5, 5, 5, 5],
                        borderColor: '#f44336',
                        backgroundColor: 'rgba(244,67,54,0.08)',
                        tension: 0.4,
                        pointRadius: 3,
                        pointBackgroundColor: '#fff',
                        pointBorderWidth: 2,
                        borderWidth: 2,
                        fill: false
                    }
                ]
            },
            options: {
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#222',
                        borderColor: '#fff',
                        borderWidth: 1,
                        padding: 10,
                        caretSize: 6,
                        cornerRadius: 4
                    }
                },
                layout: {
                    padding: { left: 10, right: 10, top: 20, bottom: 10 }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#eee', drawBorder: false },
                        ticks: { color: '#888', font: { size: 13 }, padding: 8 }
                    },
                    x: {
                        grid: { color: '#eee', drawBorder: false },
                        ticks: { color: '#888', font: { size: 13 }, padding: 8 }
                    }
                }
            }
        });
    } else if (retry < 20) {
        setTimeout(function() { initOverviewChart(retry + 1); }, 100);
    }
})();
