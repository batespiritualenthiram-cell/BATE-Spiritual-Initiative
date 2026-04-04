/* ============================================
   BHARATHIYA ART TECH EXPERTISM
   Server-Side PDF Generator Module
   ============================================ */

const PDFDocument = require('pdfkit');

// Sanskrit numeral mapping
const SANSKRIT_DIGITS = {
    '0': '०', '1': '१', '2': '२', '3': '३', '4': '४',
    '5': '५', '6': '६', '7': '७', '8': '८', '9': '९'
};

/**
 * Convert a number to Sanskrit numerals
 * @param {number|string} num - The number to convert
 * @returns {string} Sanskrit numeral string
 */
function toSanskritNumerals(num) {
    return String(num).split('').map(d => SANSKRIT_DIGITS[d] || d).join('');
}

/**
 * Generate a unique 6-digit registration ID
 * @returns {{ numeric: number, sanskrit: string }}
 */
function generateRegistrationId() {
    const id = Math.floor(100000 + Math.random() * 900000);
    return {
        numeric: id,
        sanskrit: toSanskritNumerals(id)
    };
}

/**
 * Format 24h time to 12h AM/PM
 * @param {string} time24 - Time in HH:MM format
 * @returns {string}
 */
function formatTime(time24) {
    if (!time24) return '';
    const [h, m] = time24.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
}

/**
 * Generate a PDF astrology report
 * @param {Object} data - User data
 * @param {string} data.name - User's full name
 * @param {string} data.dob - Date of birth (formatted string)
 * @param {string} data.tob - Time of birth (HH:MM)
 * @param {string} data.pob - Place of birth
 * @param {Object} data.regId - Registration ID object { numeric, sanskrit }
 * @returns {Promise<Buffer>} PDF buffer
 */
function generateReport(data) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 50, bottom: 50, left: 50, right: 50 },
                info: {
                    Title: 'Bharathiya Art Tech Expertism - Astrology Report',
                    Author: 'Bharathiya Art Tech Expertism',
                    Subject: `Vedic Astrology Report for ${data.name}`,
                    Keywords: 'astrology, vedic, horoscope, report'
                }
            });

            const buffers = [];
            doc.on('data', chunk => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            const pageWidth = doc.page.width;
            const margin = 50;
            const contentWidth = pageWidth - 2 * margin;

            // Colors
            const darkBg = '#0a0a1a';
            const purple = '#7c3aed';
            const gold = '#f59e0b';
            const white = '#f1f5f9';
            const muted = '#94a3b8';
            const cardBg = '#12122a';

            // === BACKGROUND ===
            doc.rect(0, 0, pageWidth, doc.page.height).fill(darkBg);

            // === TOP ACCENT BAR ===
            doc.rect(0, 0, pageWidth, 4).fill(purple);

            // === HEADER ===
            doc.fontSize(10).fillColor(gold)
                .text('VEDIC ASTROLOGY REPORT', margin, 30, { align: 'center', width: contentWidth });

            doc.fontSize(24).fillColor(white).font('Helvetica-Bold')
                .text('Bharathiya Art Tech', margin, 50, { align: 'center', width: contentWidth });

            doc.fontSize(16).fillColor(purple)
                .text('Expertism', margin, 80, { align: 'center', width: contentWidth });

            // === DIVIDER ===
            doc.moveTo(margin + 80, 105).lineTo(pageWidth - margin - 80, 105)
                .strokeColor(purple).lineWidth(0.5).stroke();

            // === REGISTRATION ID ===
            doc.fontSize(9).fillColor(muted).font('Helvetica')
                .text('REGISTRATION ID', margin, 118, { align: 'center', width: contentWidth });

            doc.fontSize(22).fillColor(gold).font('Helvetica-Bold')
                .text(data.regId.sanskrit, margin, 135, { align: 'center', width: contentWidth });

            doc.fontSize(8).fillColor(muted).font('Helvetica')
                .text(`(${data.regId.numeric})`, margin, 162, { align: 'center', width: contentWidth });

            // === USER DETAILS BOX ===
            const boxY = 180;
            const boxHeight = 90;
            doc.roundedRect(margin, boxY, contentWidth, boxHeight, 5)
                .fillAndStroke(cardBg, '#3c3c64');

            let detailY = boxY + 15;
            const labelX = margin + 15;
            const valueX = margin + 100;
            const lineHeight = 18;

            const details = [
                ['Name:', data.name],
                ['Date of Birth:', data.dob],
                ['Time of Birth:', formatTime(data.tob)],
                ['Place of Birth:', data.pob]
            ];

            details.forEach(([label, value]) => {
                doc.fontSize(9).fillColor(muted).font('Helvetica')
                    .text(label, labelX, detailY, { continued: false });
                doc.fontSize(9).fillColor(white).font('Helvetica-Bold')
                    .text(value, valueX, detailY, { continued: false });
                detailY += lineHeight;
            });

            // === REPORT CONTENT ===
            let y = boxY + boxHeight + 25;

            doc.fontSize(14).fillColor(purple).font('Helvetica-Bold')
                .text('Your Vedic Astrology Reading', margin, y, {
                    align: 'center', width: contentWidth
                });

            y += 20;
            doc.moveTo(margin + 100, y).lineTo(pageWidth - margin - 100, y)
                .strokeColor(purple).lineWidth(0.3).stroke();

            y += 15;

            // Report sections
            const sections = [
                {
                    title: 'Planetary Overview',
                    content: 'Based on your birth details, the planetary alignments at the time of your birth reveal significant cosmic influences that shape your personality, life path, and destiny. The positions of the Navagrahas (nine planets) in your birth chart indicate a unique combination of energies.'
                },
                {
                    title: 'Sun (Surya)',
                    content: 'Your Sun placement suggests strong leadership qualities, a dignified personality, and an innate desire to achieve excellence in your chosen field. You possess natural authority and are drawn to positions of responsibility.'
                },
                {
                    title: 'Moon (Chandra)',
                    content: 'The Moon\'s position in your chart reveals deep emotional intelligence and a compassionate nature. You are intuitive, nurturing, and possess a strong connection to family and heritage.'
                },
                {
                    title: 'Career & Prosperity',
                    content: 'The alignment of Jupiter and Saturn in your chart suggests a favorable period for career growth and financial stability. Your disciplined approach combined with expansive thinking will open new avenues for professional advancement.'
                },
                {
                    title: 'Relationships & Family',
                    content: 'Venus and Mars placements indicate a loving and balanced approach to relationships. Family bonds will strengthen over time and bring joy and fulfillment.'
                },
                {
                    title: 'Spiritual Growth',
                    content: 'The placement of Ketu suggests a deep spiritual inclination. Engaging in meditation, yoga, and traditional practices will enhance your inner peace and overall well-being.'
                },
                {
                    title: 'Recommendations',
                    content: '• Chant the Gayatri Mantra during sunrise for positive energy\n• Wear gemstones as recommended by a qualified Jyotishi\n• Perform charitable acts on auspicious days for karmic balance\n• Maintain a gratitude journal to align with cosmic abundance'
                }
            ];

            sections.forEach(section => {
                // Check if we need a new page
                if (y > doc.page.height - 80) {
                    doc.addPage();
                    doc.rect(0, 0, pageWidth, doc.page.height).fill(darkBg);
                    doc.rect(0, 0, pageWidth, 2).fill(purple);
                    y = 40;
                }

                doc.fontSize(10).fillColor(gold).font('Helvetica-Bold')
                    .text(section.title, margin + 5, y);
                y += 16;

                doc.fontSize(9).fillColor('#c8d2dc').font('Helvetica')
                    .text(section.content, margin + 5, y, {
                        width: contentWidth - 10,
                        lineGap: 3
                    });
                y = doc.y + 14;
            });

            // === FOOTER ===
            const footerY = doc.page.height - 40;
            doc.moveTo(margin, footerY - 5).lineTo(pageWidth - margin, footerY - 5)
                .strokeColor('#3c3c64').lineWidth(0.3).stroke();

            doc.fontSize(7).fillColor(muted).font('Helvetica')
                .text('Bharathiya Art Tech Expertism | Vedic Astrology Report', margin, footerY, {
                    align: 'center', width: contentWidth
                });
            doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')} | ID: ${data.regId.sanskrit}`, margin, footerY + 10, {
                align: 'center', width: contentWidth
            });
            doc.text('This report is for informational purposes only.', margin, footerY + 20, {
                align: 'center', width: contentWidth
            });

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = {
    generateReport,
    generateRegistrationId,
    toSanskritNumerals
};
