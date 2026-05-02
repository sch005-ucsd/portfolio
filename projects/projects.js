import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');

const projectsTitle = document.querySelector('.projects-title');
if (projectsTitle) {
    projectsTitle.textContent = `${projects.length} Projects`;
}

const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
const colors = d3.scaleOrdinal(d3.schemeTableau10);

let selectedIndex = -1;
let selectedYear = null;
let query = '';
let currentData = [];

function getQueryFiltered() {
    return projects.filter((project) => {
        let values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query.toLowerCase());
    });
}

function applyFilters() {
    let filtered = getQueryFiltered();
    if (selectedYear !== null) {
        filtered = filtered.filter((p) => p.year === selectedYear);
    }
    renderProjects(filtered, projectsContainer, 'h2');
}

function updateSelectedIndex() {
    selectedIndex = selectedYear
        ? currentData.findIndex((d) => d.label === selectedYear)
        : -1;
}

function renderPieChart(projectsGiven) {
    const svg = d3.select('#projects-pie-plot');
    svg.selectAll('path').remove();

    const legend = d3.select('.legend');
    legend.selectAll('li').remove();

    const rolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year,
    );

    currentData = rolledData.map(([year, count]) => ({
        value: count,
        label: year,
    }));

    updateSelectedIndex();

    const sliceGenerator = d3.pie().value((d) => d.value);
    const arcData = sliceGenerator(currentData);
    const arcs = arcData.map((d) => arcGenerator(d));

    arcs.forEach((arc, i) => {
        svg
            .append('path')
            .attr('d', arc)
            .attr('fill', colors(i))
            .attr('class', i === selectedIndex ? 'selected' : '')
            .on('click', () => {
                selectedYear =
                    selectedYear === currentData[i].label
                        ? null
                        : currentData[i].label;
                updateSelectedIndex();

                svg.selectAll('path').attr('class', (_, idx) =>
                    idx === selectedIndex ? 'selected' : '',
                );

                legend.selectAll('li').attr('class', (_, idx) => {
                    const base = 'legend-item';
                    return idx === selectedIndex ? `${base} selected` : base;
                });

                applyFilters();
            });
    });

    currentData.forEach((d, idx) => {
        legend
            .append('li')
            .attr('style', `--color:${colors(idx)}`)
            .attr('class', `legend-item${idx === selectedIndex ? ' selected' : ''}`)
            .html(
                `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`,
            );
    });
}

renderProjects(projects, projectsContainer, 'h2');
renderPieChart(projects);

const searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
    query = event.target.value;
    const filteredProjects = getQueryFiltered();
    renderPieChart(filteredProjects);
    applyFilters();
});
