/**
 * ComponentManager.js - จัดการ components แยกออกจาก script.js
 */
class ComponentManager {
    constructor() {
        this.components = [];
        this.listeners = new Set();
        this.nextId = 1;
    }

    // เพิ่ม component
    addComponent(type, instance = null) {
        const componentInstance = instance || this.createComponent(type);
        const component = {
            type: type,
            instance: componentInstance,
            open: true,
            id: this.generateId()
        };

        this.components.push(component);
        this.notifyChange('add', component);
        return component;
    }

    // ลบ component
    removeComponent(index) {
        if (this.components[index]) {
            const removed = this.components.splice(index, 1)[0];
            this.notifyChange('remove', removed, index);
            return removed;
        }
    }

    // คัดลอก component
    copyComponent(index) {
        if (this.components[index]) {
            const original = this.components[index];
            const json = original.instance.toJSON();
            const newInstance = this.createComponent(original.type);
            newInstance.fromJSON(json);
            
            // ทำ ID ให้ unique
            const newId = newInstance.getId() + '_copy';
            newInstance.setId(newId);

            const copy = {
                type: original.type,
                instance: newInstance,
                open: true,
                id: this.generateId()
            };

            this.components.push(copy);
            this.notifyChange('copy', copy);
            return copy;
        }
    }

    // อัพเดท component
    updateComponent(index, field, value) {
        if (this.components[index] && this.components[index].instance.updateField) {
            this.components[index].instance.updateField(field, value);
            this.notifyChange('update', this.components[index], index);
        }
    }

    // สร้าง component ใหม่
    createComponent(type) {
        const constructors = {
            'formula': FormulaComponent,
            'switch': SwitchComponent,
            'conditions': ConditionsComponent,
            'scoring': ScoringComponent
        };

        const Constructor = constructors[type];
        if (!Constructor) {
            throw new Error(`Unknown component type: ${type}`);
        }
        return new Constructor();
    }

    // ส่งออกเป็น JSON
    getComponentsAsJSON() {
        return {
            formulas: this.components.map(comp => comp.instance.toJSON())
        };
    }

    // โหลดจาก JSON
    loadFromJSON(config) {
        this.components = [];
        if (config.formulas) {
            config.formulas.forEach(formula => {
                const type = this.detectComponentType(formula);
                const instance = this.createComponent(type);
                instance.fromJSON(formula);
                this.addComponent(type, instance);
            });
        }
    }

    detectComponentType(formula) {
        if (formula.formula) return 'formula';
        if (formula.switch) return 'switch';
        if (formula.conditions) return 'conditions';
        if (formula.scoring) return 'scoring';
        throw new Error('Cannot detect component type');
    }

    generateId() {
        return 'comp_' + (this.nextId++);
    }

    // Event system
    onChange(callback) {
        this.listeners.add(callback);
    }

    notifyChange(action, component, index = null) {
        this.listeners.forEach(callback => {
            callback(action, component, index, this.components);
        });
    }

    getAllInputVariables() {
        const inputs = new Set();
        this.components.forEach(comp => {
            const compInputs = comp.instance.getInputs?.() || [];
            compInputs.forEach(input => inputs.add(input));
        });
        return Array.from(inputs);
    }
}