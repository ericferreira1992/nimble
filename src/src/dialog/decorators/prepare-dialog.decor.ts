import { PrepareDialogConfig } from '../classes/prepare-dialog-config';
import { Dialog } from '../classes/dialog';
import { INJECTABLE_METADATA_KEY } from '../../inject/injectable';

export function PrepareDialog(options: PrepareDialogConfig) {
    return function <T extends { new(...args: any[]): Dialog }>(constructor: T) {
        options = new PrepareDialogConfig(options);
        Object.assign(constructor.prototype, options);
        
        Reflect.defineMetadata(INJECTABLE_METADATA_KEY, true, constructor);
        return constructor;
    }
}