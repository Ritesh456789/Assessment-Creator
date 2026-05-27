import PDFDocument from 'pdfkit';

import type { ExamPaper } from '@core/schemas/exam-paper';

const SCHOOL_NAME = 'Delhi Public School, Sector-4, Bokaro';

function difficultyLabel(difficulty: string) {
	return difficulty === 'hard' ? 'Challenging' : `${difficulty.charAt(0).toUpperCase()}${difficulty.slice(1)}`;
}

function sectionLabel(index: number) {
	return `Section ${String.fromCharCode(65 + index)}`;
}

function sectionHeading(title: string, index: number) {
	const label = sectionLabel(index);
	return title.trim().toLowerCase() === label.toLowerCase() ? null : title;
}

function classLabel(className: string) {
	return className.replace(/^class\s*:?\s*/i, '').trim() || className;
}

export async function createPaperPdfBuffer(paper: ExamPaper): Promise<Buffer> {
	return await new Promise<Buffer>((resolve, reject) => {
		const chunks: Buffer[] = [];
		const document = new PDFDocument({ size: 'A4', margin: 34, bufferPages: true });
		const displayClassName = classLabel(paper.className);

		document.on('data', (chunk: Buffer | string) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
		document.on('end', () => resolve(Buffer.concat(chunks)));
		document.on('error', reject);

		document.fillColor('#303030').font('Helvetica-Bold').fontSize(20).text(SCHOOL_NAME, { align: 'center' });
		document.moveDown(0.25);
		document.fontSize(14).text(`Subject: ${paper.subject}`, { align: 'center' });
		document.moveDown(0.18);
		document.text(`Class: ${displayClassName}`, { align: 'center' });
		document.moveDown(1.8);

		const metadataY = document.y;
		document.font('Helvetica-Bold').fontSize(11).text(`Time Allowed: ${paper.totalTimeMinutes} minutes`, document.page.margins.left, metadataY);
		document.text(`Maximum Marks: ${paper.totalMarks}`, document.page.margins.left, metadataY, { align: 'right' });
		document.y = metadataY + 38;
		document.text('All questions are compulsory unless stated otherwise.');
		document.moveDown(1.7);

		document.text('Name: ____________________');
		document.moveDown(0.28);
		document.text('Roll Number: ______________');
		document.moveDown(0.28);
		document.text(`Class: ${displayClassName} Section: _________`);
		document.moveDown(2);

		let questionNumber = 0;
		paper.sections.forEach((section, index) => {
			document.font('Helvetica-Bold').fontSize(16).fillColor('#303030').text(sectionLabel(index), { align: 'center' });
			document.moveDown(1);
			const heading = sectionHeading(section.title, index);
			if (heading) {
				document.fontSize(11).text(heading);
			}
			document.font('Helvetica-Oblique').fontSize(10).text(section.instruction);
			document.moveDown(1);
			section.questions.forEach((question) => {
				questionNumber += 1;
				document.font('Helvetica').fontSize(10.5).text(
					`${questionNumber}. [${difficultyLabel(question.difficulty)}] ${question.text} [${question.marks} Marks]`,
					{ lineGap: 3 },
				);
				document.moveDown(0.48);
			});
			document.moveDown(1.2);
		});

		document.font('Helvetica-Bold').fontSize(10.5).text('End of Question Paper');

		if (paper.answerKey && paper.answerKey.length > 0) {
			document.moveDown(2.4);
			document.font('Helvetica-Bold').fontSize(14).fillColor('#303030').text('Answer Key:');
			document.moveDown(0.75);
			paper.answerKey.forEach((answer, index) => {
				document.font('Helvetica').fontSize(10).text(`${index + 1}. ${answer.answer || answer.text}`, { lineGap: 3 });
				document.moveDown(0.68);
			});
		}

		document.end();
	});
}
