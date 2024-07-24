export const styles = `<style>
:root {
    --primary-colour: aliceblue;
    --secondary-colour: #a7c7e7;
    --ternary-colour: #5797a7;
    font-family: Times, sans-serif
}

html, body {
    padding: 0;
    margin: 0
}

a {
    text-decoration: underline;
}

ul {
    margin: 2px;
}

h1 {
    padding: 4px 4px 10px 4px;
    margin: 0;
    font-size: 28px;

    --b: 6px; /* border thickness  */
    --g: linear-gradient(var(--secondary-colour), var(--secondary-colour));
    /*border-image: var(--g) fill 0/calc(100% - var(--b)) 0 0/0 100vw 0 0 repeat;*/
    padding-block: 10px;
}

h2 {
    display: inline-block;
    padding: 2px;
    margin: 0;
    font-size: 24px;
    width: max-content;

    --b: 4px; /* border thickness  */
    --g: linear-gradient(var(--secondary-colour), var(--secondary-colour));
    /*border-image: var(--g) fill 0/calc(100% - var(--b)) 0 0/0 0 0 100vw repeat;*/
    padding-block: 10px;
}

p {
    padding: 4px 2px;
    margin: 0;
    font-size: 16px;
    text-align: justify;
}

.flex-row {
    display: flex;
    flex-direction: row;
}

.flex-col {
    display: flex;
    flex-direction: column;
}

.align-center {
    align-items: center
}

.justify-center {
    justify-content: center
}

.justify-between {
    justify-content: space-between
}

.justify-around {
    justify-content: space-around
}

.inline-block {
    display: inline-block;
}

.bg-primary {
    background-color: var(--primary-colour)
}

.p-8 {
    padding: 16px;
}

.m-2 {
    margin: 4px;
}


.m-8 {
    margin: 16px;
}

.sm\\:w-3\\/4 {
    @media (min-width: 512px) {
        max-width: 75% !important;
    }
}

.md\\:w-1\\/2 {
    @media (min-width: 768px) {
        max-width: 50% !important;
    }
}

.lg\\:w-2\\/5 {
    @media (min-width: 1024px) {
        width: 40% !important;
    }
}

.xl\\:w-1\\/3 {
    @media (min-width: 1280px) {
        width: 33% !important;
    }
}

.w-full {
    max-width: 100%;
}

.hidden {
    display: none;
}

.invisible {
    visibility: hidden;
}
</style>`