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

  const xValues = Array.from({ length: 121 }, (_, i) => -3 + i * 6 / 120);
  const lambdaValues = Array.from({ length: 121 }, (_, i) => -2 + i * 6 / 120);
  const x0Values = lambdaValues.map(lambda =>
    xValues.map(x => x - lambda * Math.sin(x))
  );
  const curveX = Array.from({ length: 2401 }, (_, i) => -3 + i * 6 / 2400);
  const mainBranchLambda = Array.from({ length: 2401 }, (_, i) => -2 + i * 6 / 2400);
  const mainBranchX = mainBranchLambda.map(() => 0);
  const levelCurve = (level, color) => {
    const lambdas = curveX.map(x => {
      // x/sin(x) has the removable limit 1 at zero; nonzero levels have a pole.
      const lambda = x === 0 ? (level === 0 ? 1 : NaN) : (x - level) / Math.sin(x);
      return Number.isFinite(lambda) && lambda >= -2 && lambda <= 4 ? lambda : null;
    });
    return {
      type: 'scatter3d', mode: 'lines',
      x: curveX, y: lambdas, z: curveX.map(() => level),
      connectgaps: false,
      line: { color, width: 6 },
      hovertemplate: 'x = %{x:.3f}<br>λ = %{y:.3f}<br>x₀ = %{z:.3f}<extra></extra>'
    };
  };

  Plotly.newPlot('equilibrium', [{
    type: 'surface',
    x: xValues,
    y: lambdaValues,
    z: x0Values,
    colorscale: 'Viridis',
    showscale: false,
    hovertemplate: 'x = %{x:.3f}<br>λ = %{y:.3f}<br>x₀ = %{z:.3f}<extra></extra>'
  }, {
    type: 'scatter3d', mode: 'lines',
    x: mainBranchX, y: mainBranchLambda, z: mainBranchX,
    line: { color: 'blue', width: 6 },
    hovertemplate: 'x = 0<br>λ = %{y:.3f}<br>x₀ = 0<extra></extra>'
  }, levelCurve(0, 'blue'), levelCurve(0.5, 'red'), levelCurve(-1.0, 'orange')], {
    ...baseLayout,
    scene: {
      xaxis: { title: { text: 'x' }, range: [-3, 3] },
      yaxis: { title: { text: 'λ' }, range: [-2, 4] },
      zaxis: { title: { text: 'x₀' } },
      aspectmode: 'cube'
    }
  }, config);

  const bifurcationCurves = [[-1.0, 'orange'], [0, 'blue'], [0.5, 'red']].map(([level, color]) => {
    const curve = levelCurve(level, color);
    return {
      type: 'scatter', mode: 'lines',
      x: curve.y, y: curve.x,
      name: `x₀ = ${level === -1 ? level.toFixed(1) : level}`, legendgroup: String(level),
      connectgaps: false,
      line: { color, width: 3 },
      hovertemplate: `λ = %{x:.3f}<br>x = %{y:.3f}<br>x₀ = ${level}<extra></extra>`
    };
  });
  // Include the x = 0 branch in the zero-level legend group.
  bifurcationCurves.push({
    type: 'scatter', mode: 'lines',
    x: mainBranchLambda, y: mainBranchX,
    name: 'x₀ = 0', legendgroup: '0', showlegend: false,
    line: { color: 'blue', width: 3 },
    hovertemplate: 'λ = %{x:.3f}<br>x = 0<br>x₀ = 0<extra></extra>'
  });

  Plotly.newPlot('bifurcation', bifurcationCurves, {
    ...baseLayout,
    showlegend: true,
    legend: { orientation: 'h', x: 0, y: 1.12 },
    xaxis: { ...axis('λ'), range: [-2, 4] },
    yaxis: { ...axis('x'), range: [-3, 3] }
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
