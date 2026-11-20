function integrate(lambda, x0, gamma, x_init, v_init, h, steps){
  // return an array of `steps+1` [x, v] pairs, starting from the initial conditions.
  const result = [[x_init, v_init]];
  let x = x_init;
  let v = v_init;
  for (let i = 0; i < steps; i++) {
    const dx1 = v;
    const dv1 = lambda * Math.sin(x) - x + x0 - gamma * v;

    const v1 = v + 0.5 * h * dv1;
    const x1 = x + 0.5 * h * dx1;

    const dx2 = v1;
    const dv2 = lambda * Math.sin(x1) - x1 + x0 - gamma * v1;

    const v2 = v + 0.5 * h * dv2;
    const x2 = x + 0.5 * h * dx2;

    const dx3 = v2;
    const dv3 = lambda * Math.sin(x2) - x2 + x0 - gamma * v2;

    const v3 = v + h * dv3;
    const x3 = x + h * dx3;

    const dx4 = v3;
    const dv4 = lambda * Math.sin(x3) - x3 + x0 - gamma * v3;

    // RK4 update
    x += (h / 6) * (dx1 + 2*dx2 + 2*dx3 + dx4);
    v += (h / 6) * (dv1 + 2*dv2 + 2*dv3 + dv4);

    result.push([x, v]);
  }
  return result;
}

document.addEventListener('DOMContentLoaded', () => {
  // Phase diagram: 30x20 grid of vector-field arrows, independent of Plotly.
  const PHASE_NI = 30;
  const PHASE_NJ = 20;
  const scale_x = 0.2;
  const scale_v = 0.2;
  const scaled_x = i => (i - 14.5) * scale_x;
  const scaled_v = j => (j - 9.5) * scale_v;

  // System: x0 = x - lambda*sin(x) at equilibrium, i.e. F = lambda*sin(x) - x + x0.
  const F = (x, lambda, x0) => lambda * Math.sin(x) - x + x0;

  // Current parameter values, set by the sliders above the diagrams and by
  // clicking the bifurcation diagram below. gamma = 0 means undamped.
  let lambda = 2.0;
  let x0 = 0.2;
  let gamma = 0;

  // Build the arrow grid: arrow [i][j] sits at (i + 0.5, j + 0.5) in the flipped
  // #phase-plot-area coordinates, so j increases upward.
  const phasePlotArea = document.getElementById('phase-plot-area');
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const arrows = [];
  for (let i = 0; i < PHASE_NI; i++) {
    arrows[i] = [];
    for (let j = 0; j < PHASE_NJ; j++) {
      const holder = document.createElementNS(SVG_NS, 'g');
      holder.setAttribute('transform', `translate(${i + 0.5} ${j + 0.5})`);
      const use = document.createElementNS(SVG_NS, 'use');
      use.setAttribute('id', `arrow_${i}_${j}`);
      use.setAttribute('href', '#arrow');
      holder.appendChild(use);
      phasePlotArea.appendChild(holder);
      arrows[i][j] = use;
    }
  }

  function update_phase_diagram() {
    for (let i = 0; i < PHASE_NI; i++) {
      for (let j = 0; j < PHASE_NJ; j++) {
        const x = scaled_x(i);
        const v = scaled_v(j);
        // Damped dynamics: x' = v, v' = F(x, lambda, x0) - gamma * v.
        const angle = Math.atan2(F(x, lambda, x0) - gamma * v, v);
        arrows[i][j].setAttribute('transform', `rotate(${angle * 180 / Math.PI})`);
      }
    }
  }

  update_phase_diagram();

  // Parameter sliders above the diagrams.
  const sliders = {
    lambda: document.getElementById('lambda-slider'),
    x0: document.getElementById('x0-slider'),
    gamma: document.getElementById('gamma-slider')
  };
  const outputs = {
    lambda: document.getElementById('lambda-value'),
    x0: document.getElementById('x0-value'),
    gamma: document.getElementById('gamma-value')
  };
  const fmt = value => value.toFixed(2);

  function syncParamControls() {
    sliders.lambda.value = lambda;
    sliders.x0.value = x0;
    sliders.gamma.value = gamma;
    outputs.lambda.textContent = fmt(lambda);
    outputs.x0.textContent = fmt(x0);
    outputs.gamma.textContent = fmt(gamma);
  }

  sliders.lambda.addEventListener('input', () => {
    lambda = parseFloat(sliders.lambda.value);
    outputs.lambda.textContent = fmt(lambda);
    update_phase_diagram();
  });
  sliders.x0.addEventListener('input', () => {
    x0 = parseFloat(sliders.x0.value);
    outputs.x0.textContent = fmt(x0);
    update_phase_diagram();
    update_physical_diagram();
  });
  sliders.gamma.addEventListener('input', () => {
    gamma = parseFloat(sliders.gamma.value);
    outputs.gamma.textContent = fmt(gamma);
    update_phase_diagram();
  });

  syncParamControls();

  // Physical representation: the rod's angle comes from the x selected on the
  // bifurcation diagram; the floor's tilt is hooked to the x0 slider.
  // Both rotate with the same sign so that x = x0 tilts them identically
  // (inside the y-flipped frame, positive rotate() = CCW math angle).
  const rodGroup = document.getElementById('rod-group');
  const floorGroup = document.getElementById('floor-group');
  const RAD2DEG = 180 / Math.PI;
  let selectedX = 0;

  function update_physical_diagram() {
    rodGroup.setAttribute('transform', `rotate(${selectedX * RAD2DEG})`);
    floorGroup.setAttribute('transform', `rotate(${x0 * RAD2DEG})`);
  }

  update_physical_diagram();

  if (!window.Plotly) {
    document.querySelectorAll('div.plot').forEach(plot => {
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

  // Marker for the currently selected (λ, x) point; starts empty.
  bifurcationCurves.push({
    type: 'scatter', mode: 'markers', name: 'selected',
    x: [], y: [], showlegend: false,
    marker: { color: '#172333', size: 13, symbol: 'diamond', line: { color: '#ffffff', width: 1 } },
    hovertemplate: 'selected: λ = %{x:.3f}<br>x = %{y:.3f}<extra></extra>'
  });

  Plotly.newPlot('bifurcation', bifurcationCurves, {
    ...baseLayout,
    showlegend: true,
    legend: { orientation: 'h', x: 0, y: 1.12 },
    xaxis: { ...axis('λ'), range: [-2, 4] },
    yaxis: { ...axis('x'), range: [-3, 3] }
  }, config);

  // Click anywhere on the bifurcation diagram to select the system
  // parameters: x0 is the equilibrium level through the clicked point, i.e.
  // x0 = x - λ·sin(x).
  const BIF_MARKER_TRACE = bifurcationCurves.length - 1;
  const bifDiv = document.getElementById('bifurcation');

  // Raw DOM click → plot coordinates, so any click inside the axes works (no
  // snapping, unlike plotly_click which only fires on traces). Pixel→data
  // conversion uses Plotly's internal axis mapping: p2c expects pixels
  // relative to the top-left of the plot area = div box minus layout margins.
  let downPos = null;
  bifDiv.addEventListener('pointerdown', e => {
    downPos = [e.clientX, e.clientY];
  });
  bifDiv.addEventListener('click', e => {
    // Ignore clicks that terminate a zoom/pan drag.
    if (downPos && (e.clientX - downPos[0]) ** 2 + (e.clientY - downPos[1]) ** 2 > 25) {
      return;
    }
    const fullLayout = bifDiv._fullLayout;
    if (!fullLayout) return; // not initialised yet
    const rect = bifDiv.getBoundingClientRect();
    const size = fullLayout._size;
    const xpx = e.clientX - rect.left - size.l;
    const ypx = e.clientY - rect.top - size.t;
    if (xpx < 0 || xpx > size.w || ypx < 0 || ypx > size.h) return; // outside axes
    const clickedLambda = fullLayout.xaxis.p2c(xpx);
    const clickedX = fullLayout.yaxis.p2c(ypx);
    x0 = clickedX - clickedLambda * Math.sin(clickedX);
    lambda = clickedLambda;
    selectedX = clickedX;
    syncParamControls();
    update_phase_diagram();
    update_physical_diagram();
    Plotly.restyle('bifurcation',
      { x: [[lambda]], y: [[clickedX]] }, [BIF_MARKER_TRACE]);
  });
});
