document.addEventListener('DOMContentLoaded', () => {
  if (!window.Plotly) {
    document.querySelectorAll('.plot').forEach(plot => {
      plot.textContent = 'Plotly could not load. Check your internet connection and reload.';
    });
    return;
  }

  const config = { responsive: true, displaylogo: false };
  const baseLayout = {
    autosize: true,
    margin: { l: 65, r: 25, t: 25, b: 55 },
    font: { family: 'system-ui, sans-serif', size: 14, color: '#172333' },
    paper_bgcolor: '#ffffff',
    plot_bgcolor: '#ffffff',
    showlegend: false
  };
  const axis = title => ({ title: { text: title }, range: [-1, 1], automargin: true });

  // An empty 3D trace initializes the scene without adding any plot content.
  // Axis meanings for the equilibrium surface can be assigned with the model.
  Plotly.newPlot('equilibrium', [{ type: 'scatter3d', x: [], y: [], z: [] }], {
    ...baseLayout,
    scene: {
      xaxis: axis(''),
      yaxis: axis(''),
      zaxis: axis(''),
      aspectmode: 'cube'
    }
  }, config);

  Plotly.newPlot('bifurcation', [], {
    ...baseLayout, xaxis: axis('λ'), yaxis: axis('x')
  }, config);

  Plotly.newPlot('phase', [], {
    ...baseLayout, xaxis: axis('x'), yaxis: axis('x\u0307')
  }, config);

  Plotly.newPlot('physical', [], {
    ...baseLayout,
    xaxis: axis('sin x'),
    yaxis: { ...axis('cos x'), scaleanchor: 'x', scaleratio: 1, constrain: 'domain' }
  }, config);
});
