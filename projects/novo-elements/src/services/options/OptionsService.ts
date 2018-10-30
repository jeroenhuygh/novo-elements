// NG2
import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
// App

@Injectable()
export class OptionsService {
  constructor() {}

  getOptionsConfig(http: HttpClient, field: any, config: { token?: string; restUrl?: string; military?: boolean }): any {
    const secondaryFilterParam =
      field.secondaryFilter && field.secondaryFilter.length > 0 ? `&secondaryFilter=${field.secondaryFilter}` : '';

    return {
      field: 'value',
      format: '$label',
      options: (query) => {
        return new Promise((resolve, reject) => {
          if (query && query.length) {
            http.get(`${field.optionsUrl}?filter=${query || ''}${secondaryFilterParam}`).subscribe(resolve, reject);
          } else {
            resolve([]);
          }
        });
      },
    };
  }
}
