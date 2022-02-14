/*eslint-disable */

const locations = JSON.parse(document.getElementById('map').dataset.locations);
console.log(locations);

mapboxgl.accessToken =
  'pk.eyJ1Ijoib21wcmFrYXNoc2lydmkiLCJhIjoiY2t6aWluZ2F5MGJ0NzJ2bGxibWpkcGk3YyJ9.MEdUElKX7MGaLgs_IHYdRg';
var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v11',
});
