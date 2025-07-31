/**
 * Shared operators for all RuleFlow components
 */

/**
 * Get complete operator options HTML
 */
function getOperatorOptions(selectedOp = '') {
    const operators = [
        { value: '==', label: '= Equals', group: 'Comparison' },
        { value: '!=', label: '≠ Not Equals', group: 'Comparison' },
        { value: '>', label: '> Greater Than', group: 'Comparison' },
        { value: '>=', label: '≥ Greater or Equal', group: 'Comparison' },
        { value: '<', label: '< Less Than', group: 'Comparison' },
        { value: '<=', label: '≤ Less or Equal', group: 'Comparison' },
        { value: 'between', label: '⟷ Between (Range)', group: 'Range' },
        { value: 'in', label: '∈ In Array', group: 'Array' },
        { value: 'not_in', label: '∉ Not In Array', group: 'Array' },
        { value: 'contains', label: '⊇ Contains', group: 'String' },
        { value: 'starts_with', label: '⤴ Starts With', group: 'String' },
        { value: 'ends_with', label: '⤵ Ends With', group: 'String' }
    ];

    let html = '';
    let currentGroup = '';

    operators.forEach(op => {
        if (currentGroup !== op.group) {
            if (currentGroup !== '') html += '</optgroup>';
            html += `<optgroup label="${op.group}">`;
            currentGroup = op.group;
        }
        
        const selected = selectedOp === op.value ? 'selected' : '';
        html += `<option value="${op.value}" ${selected}>${op.label}</option>`;
    });
    
    if (currentGroup !== '') html += '</optgroup>';
    
    return html;
}

/**
 * Get placeholder text for operator values
 */
function getValuePlaceholder(operator) {
    const placeholders = {
        'between': '[min, max] e.g., [18, 65]',
        'in': '["value1", "value2"] or [1, 2, 3]',
        'not_in': '["value1", "value2"] or [1, 2, 3]',
        'contains': 'Text to search for',
        'starts_with': 'Starting text',
        'ends_with': 'Ending text',
        '==': 'Value to match',
        '!=': 'Value to exclude',
        '>': 'Minimum value (exclusive)',
        '>=': 'Minimum value (inclusive)',
        '<': 'Maximum value (exclusive)',
        '<=': 'Maximum value (inclusive)'
    };
    
    return placeholders[operator] || 'Enter value';
}

// Export for global use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getOperatorOptions, getValuePlaceholder };
} else {
    window.getOperatorOptions = getOperatorOptions;
    window.getValuePlaceholder = getValuePlaceholder;
}