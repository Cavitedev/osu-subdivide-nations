# Forma 1
Añadir una imagen dentro del elemento

```html
<img class="flag-country flag-country--medium" data-orig-title="Spain" data-hasqtip="9" aria-describedby="qtip-9" src="https://upload.wikimedia.org/wikipedia/commons/9/9a/Bandera_de_Andalucia.svg">
```

# Forma 2 Base 64

```css
background: url('data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNTAgMjgiIHdpZHRoPSIxMDAwIiBoZWlnaHQ9IjU2MCI+DQo8cGF0aCBkPSJNMCwwIHYyOCBoNTAgdi0yOCB6IiBmaWxsPSIjRDUyQjFFIi8+DQo8cGF0aCBkPSJNMCwwIEw1MCwyOCBNNTAsMCBMMCwyOCIgc3Ryb2tlPSIjMDA5QjQ4IiBzdHJva2Utd2lkdGg9IjQuMyIvPg0KPHBhdGggZD0iTTI1LDAgdjI4IE0wLDE0IGg1MCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjQuMyIvPg0KPC9zdmc+') no-repeat center; background-size: cover;
```

```css
background: url('data:image/svg+xml;base64,') no-repeat center; background-size: cover;
```

# Forma 3 Css a pelo

Ocupa más por el encoding de HTML

```css
background: url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22300%22%20height%3D%22200%22%3E%3Ccircle%20cx%3D%22150%22%20cy%3D%22100%22%20r%3D%22100%22%20fill%3D%22blue%22%20%2F%3E%3C%2Fsvg%3E')
```