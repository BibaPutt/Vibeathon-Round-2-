// Script to rechunk codes.json - separates function headers, logic, and closing blocks
const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'codes.json'), 'utf8'));

const rechunked = { problems: [] };

for (const prob of data.problems) {
    const lang = prob.language;
    const nonDistractors = prob.code_chunks.filter(c => !c.is_distractor);
    const distractors = prob.code_chunks.filter(c => c.is_distractor);

    // Join all non-distractor code in order
    const fullCode = nonDistractors
        .sort((a, b) => prob.solution_order.indexOf(a.id) - prob.solution_order.indexOf(b.id))
        .map(c => c.content)
        .join('\n');

    // Split into better chunks based on language
    let newChunks = [];
    const lines = fullCode.split('\n');

    if (lang === 'Python') {
        newChunks = splitPython(lines);
    } else if (lang === 'Java') {
        newChunks = splitJava(lines);
    } else if (lang === 'C++') {
        newChunks = splitCpp(lines);
    }

    // If chunking produced fewer than 3 chunks, keep original
    if (newChunks.length < 3) {
        rechunked.problems.push(prob);
        continue;
    }

    // Build new code_chunks
    const codeChunks = [];
    const solutionOrder = [];

    newChunks.forEach((chunk, i) => {
        const id = `c${i + 1}`;
        codeChunks.push({
            id,
            content: chunk.trim(),
            is_distractor: false
        });
        solutionOrder.push(id);
    });

    // Re-number distractors
    distractors.forEach((d, i) => {
        codeChunks.push({
            id: `d${i + 1}`,
            content: d.content,
            is_distractor: true
        });
    });

    // Increase allowed moves based on chunk count
    const newMoves = Math.max(prob.allowed_moves, solutionOrder.length + distractors.length + 2);

    rechunked.problems.push({
        id: prob.id,
        language: prob.language,
        difficulty: prob.difficulty,
        task: prob.task,
        allowed_moves: newMoves,
        code_chunks: codeChunks,
        solution_order: solutionOrder
    });
}

function splitPython(lines) {
    const chunks = [];
    let current = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Start new chunk on function/class definitions
        if ((trimmed.startsWith('def ') || trimmed.startsWith('class ')) && current.length > 0) {
            chunks.push(current.join('\n'));
            current = [];
        }

        current.push(line);

        // Split after function signature line (the line with the colon)
        if ((trimmed.startsWith('def main') || trimmed === 'main()') && !trimmed.startsWith('def main(')) {
            // standalone main() call - make it its own chunk
            if (trimmed === 'main()' && current.length >= 1) {
                // Check if current has more than just main()
                if (current.length > 1) {
                    const mainCall = current.pop();
                    chunks.push(current.join('\n'));
                    current = [mainCall];
                }
            }
        }
    }

    if (current.length > 0) {
        chunks.push(current.join('\n'));
    }

    // Post-process: separate standalone main() calls
    const finalChunks = [];
    for (const chunk of chunks) {
        const chunkLines = chunk.split('\n');
        const lastLine = chunkLines[chunkLines.length - 1].trim();

        if (lastLine === 'main()' && chunkLines.length > 1) {
            finalChunks.push(chunkLines.slice(0, -1).join('\n'));
            finalChunks.push('main()');
        } else {
            finalChunks.push(chunk);
        }
    }

    // Further split: if a chunk has def main(): with logic, separate them
    const result = [];
    for (const chunk of finalChunks) {
        const cl = chunk.split('\n');

        // Find def main(): and split after it
        let mainIdx = -1;
        for (let i = 0; i < cl.length; i++) {
            if (cl[i].trim().startsWith('def main(') && cl[i].trim().endsWith(':')) {
                mainIdx = i;
                break;
            }
        }

        if (mainIdx >= 0 && mainIdx < cl.length - 1 && cl.length > 2) {
            // Split: everything before+including def main(): as one chunk
            // Everything after as another chunk
            result.push(cl.slice(0, mainIdx + 1).join('\n'));
            result.push(cl.slice(mainIdx + 1).join('\n'));
        } else {
            result.push(chunk);
        }
    }

    // Filter empty chunks
    return result.filter(c => c.trim().length > 0);
}

function splitJava(lines) {
    const chunks = [];
    let current = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Start new chunk on class declarations
        if (trimmed.startsWith('class ') && current.length > 0) {
            chunks.push(current.join('\n'));
            current = [];
        }

        current.push(line);

        // Split after "public static void main" opening brace
        if (trimmed.includes('public static void main') && trimmed.endsWith('{')) {
            chunks.push(current.join('\n'));
            current = [];
            continue;
        }

        // Split closing braces that end a class (}) on its own line as last
        if (trimmed === '}' && i > 0) {
            const prevTrimmed = lines[i - 1].trim();
            if (prevTrimmed === '}') {
                // Multiple closing braces - keep them together with previous
                continue;
            }
        }
    }

    if (current.length > 0) {
        chunks.push(current.join('\n'));
    }

    // Post-process: separate closing "    }\n}" blocks
    const result = [];
    for (const chunk of chunks) {
        const cl = chunk.split('\n');

        // If chunk ends with just closing braces (like "    }\n}"), separate them
        let closingStart = cl.length;
        for (let i = cl.length - 1; i >= 0; i--) {
            if (cl[i].trim() === '}' || cl[i].trim() === '};') {
                closingStart = i;
            } else {
                break;
            }
        }

        if (closingStart > 0 && closingStart < cl.length && cl.length > 2) {
            result.push(cl.slice(0, closingStart).join('\n'));
            result.push(cl.slice(closingStart).join('\n'));
        } else {
            result.push(chunk);
        }
    }

    return result.filter(c => c.trim().length > 0);
}

function splitCpp(lines) {
    const chunks = [];
    let current = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Start new chunk on includes, class, or function definitions
        if ((trimmed.startsWith('#include') || trimmed.startsWith('class ')) && current.length > 0) {
            chunks.push(current.join('\n'));
            current = [];
        }

        current.push(line);

        // Split after "int main() {" 
        if (trimmed.startsWith('int main()') && trimmed.endsWith('{')) {
            chunks.push(current.join('\n'));
            current = [];
            continue;
        }
    }

    if (current.length > 0) {
        chunks.push(current.join('\n'));
    }

    // Post-process: separate "return 0;\n}" from logic
    const result = [];
    for (const chunk of chunks) {
        const cl = chunk.split('\n');

        // Check if chunk ends with "return 0;" + "}"
        if (cl.length > 2) {
            let closingStart = cl.length;
            for (let i = cl.length - 1; i >= 0; i--) {
                const t = cl[i].trim();
                if (t === '}' || t === '};' || t === 'return 0;') {
                    closingStart = i;
                } else {
                    break;
                }
            }

            if (closingStart > 0 && closingStart < cl.length) {
                result.push(cl.slice(0, closingStart).join('\n'));
                result.push(cl.slice(closingStart).join('\n'));
            } else {
                result.push(chunk);
            }
        } else {
            result.push(chunk);
        }
    }

    return result.filter(c => c.trim().length > 0);
}

fs.writeFileSync(
    path.join(__dirname, 'codes.json'),
    JSON.stringify(rechunked, null, 4),
    'utf8'
);

console.log(`Rechunked ${rechunked.problems.length} problems.`);

// Print summary
for (const p of rechunked.problems) {
    const nonDist = p.code_chunks.filter(c => !c.is_distractor).length;
    const dist = p.code_chunks.filter(c => c.is_distractor).length;
    console.log(`${p.id} (${p.language} ${p.difficulty}): ${nonDist} chunks + ${dist} distractors = ${p.code_chunks.length} total, moves: ${p.allowed_moves}`);
}
