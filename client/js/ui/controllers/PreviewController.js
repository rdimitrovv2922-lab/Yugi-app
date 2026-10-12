import { CARD_BACK_URL } from '../rendering/opRenderer.js';

export default class PreviewController {
    constructor() {
        this.preview = document.getElementById('card-preview');
        this.previewName = document.getElementById('card-preview-name');
        this.previewImage = document.getElementById('card-preview-image');
        this.previewDetails = document.getElementById('card-preview-details');
        this.previewDescription = document.getElementById('card-preview-dsc');

        this.previewImage.src = CARD_BACK_URL;
        this.previewImage.alt = 'Card back';
        this.previewImage.classList.remove('hidden');
    }

    showCard(card) {
        const data = card.rawApiData || {};

        const levelOrLink = data.level !== undefined
            ? `Level / Rank: ${data.level}`
            : data.linkval !== undefined
                ? `Link: ${data.linkval}`
                : null;

        const rows = [
            { values: [data.type], fullWidth: true },
            { values: [
                data.attribute && `Attribute: ${data.attribute}`,
                data.race && `Type: ${data.race}`
            ] },
            { values: [
                levelOrLink,
                data.scale !== undefined && `Scale: ${data.scale}`
            ] },
            { values: [
                data.atk !== undefined && `ATK: ${data.atk}`,
                data.def !== undefined && `DEF: ${data.def}`
            ] }
        ].filter(row => row.values.some(Boolean));

        this.previewDetails.replaceChildren();

        for (const rowData of rows) {
            const rowElement = document.createElement('div');
            rowElement.className = 'card-preview-row';

            for (const value of rowData.values) {
                const cell = document.createElement('span');
                cell.textContent = value || '';

                if (rowData.fullWidth) {
                    cell.classList.add('full-width');
                }

                rowElement.appendChild(cell);
            }

            this.previewDetails.appendChild(rowElement);
        }

        this.previewName.textContent = card.name;
        this.previewImage.src = card.imageUrl;
        this.previewImage.alt = card.name;
        this.previewImage.classList.remove('hidden');
        this.previewDescription.textContent = data.desc;
        this.preview.scrollTop = 0;
    }
}
