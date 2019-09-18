// NG2
import { async, TestBed } from '@angular/core/testing';
// App
import { NovoTabbedGroupPickerElement, TabbedGroupPickerSchema, TabbedGroupPickerQuickSelect } from './TabbedGroupPicker';
import { NovoTabbedGroupPickerModule } from './TabbedGroupPicker.module';
import { ComponentUtils } from '../../utils/component-utils/ComponentUtils';
import { NovoLabelService } from '../../services/novo-label-service';

describe('Elements: NovoTabbedGroupPickerElement', () => {
  let fixture;
  let component: NovoTabbedGroupPickerElement;

  const getChickenSchema = (): TabbedGroupPickerSchema => ({
    typeName: 'chickens',
    typeLabel: 'Chickens',
    valueField: 'chickenId',
    labelField: 'bwaack',
    data: [
      ({ chickenId: 3, bwaack: 'bwock?' } as unknown) as { selected?: boolean },
      ({ chickenId: 4, bwaack: 'baa bock' } as unknown) as { selected?: boolean },
    ],
  });

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: ComponentUtils, useClass: ComponentUtils }, NovoLabelService],
      imports: [NovoTabbedGroupPickerModule],
    }).compileComponents();
    fixture = TestBed.createComponent(NovoTabbedGroupPickerElement);
    component = fixture.debugElement.componentInstance;
  }));

  it('should initialize correctly', () => {
    expect(component).toBeTruthy();
  });

  describe('Function: ngOnInit', () => {
    beforeEach(() => {
      spyOn(component, 'setDisplaySchemaIndex').and.callFake(() => {});
      component.schemata = [
        {
          typeName: 'firstTypeName',
          typeLabel: 'firstTypeLabel',
          valueField: 'firstValueField',
          labelField: 'firstLabelField',
          data: [],
        },
        {
          typeName: 'secondTypeName',
          typeLabel: 'secondTypeLabel',
          valueField: 'secondValueField',
          labelField: 'secondLabelField',
          data: [],
        },
      ];
    });
    it('should activate the first item in the input schemata array', () => {
      component.ngOnInit();
      expect(component.setDisplaySchemaIndex).toHaveBeenCalledWith(0);
    });
    it('should stop loading', () => {
      component.ngOnInit();
      expect(component.loading).toEqual(false);
    });
  });
  describe('function: filter', () => {
    beforeEach(() => {
      spyOn(component, 'setDisplaySchemaIndex').and.callFake(() => {});
    });

    const getLetter = (n: number) => String.fromCharCode((n % 26) + 65);

    const turnNumbersIntoLetters = (val: string): string =>
      Array.from(val)
        .map((n) => parseInt(n, 10))
        .map(getLetter)
        .join('');

    const buildBigDataset = (): { data; schemata } => {
      const names: string[] = Array(2000)
        .fill(0)
        .map((e, i) => String(Math.pow(1000 + i, 5))); // make a bunch of ~16 character strings
      const schemaNames = names.slice(0, 1000);
      const labelFieldNames = names.splice(0, 1000);
      const schemata = schemaNames.map((typeName, i) => ({
        typeName,
        labelField: labelFieldNames[i], // search/filter only looks at labelField
      }));
      const data = {};
      schemata.forEach(({ labelField, typeName }) => {
        data[typeName] = Array(1000)
          .fill(0)
          .map((n, i) => ({
            [labelField]: turnNumbersIntoLetters(`${labelField}${i}`),
          }));
      });
      return { data, schemata };
    };

    xit('should filter large datasets in a reasonable amount of time', () => {
      const amountOfTimeInMillisecondsThatIndicatesAGrosslyInefficientAlgorithm = 4000;
      const { data, schemata } = buildBigDataset();
      component.schemata = schemata;

      const start = performance.now();
      component.filter('asdfasdf');
      const timeItTakesToSearchAMillionItems = performance.now() - start;

      expect(timeItTakesToSearchAMillionItems).toBeLessThan(amountOfTimeInMillisecondsThatIndicatesAGrosslyInefficientAlgorithm);
    });
  });
  describe('createChildrenReferences', () => {
    it('should make it so that children of data list items are references to other data list items', () => {
      const dinosaurs = [
        {
          id: 5,
          name: 'Allosaurus',
          children: [{ chickenId: 3, bwaack: 'bwock?' }, { chickenId: 4, bwaack: 'tweeet' }],
        },
      ];
      component.schemata = [
        getChickenSchema(),
        {
          typeName: 'dinosaurs',
          typeLabel: 'Dinosaurs',
          valueField: 'id',
          labelField: 'name',
          childTypeName: 'chickens',
          data: dinosaurs,
        },
      ];
      const chicken = component.schemata[0].data[0];
      let childOfAllosaurus = component.schemata[1].data[0]['children'][0];
      expect(childOfAllosaurus).not.toBe(chicken);

      component.createChildrenReferences();

      childOfAllosaurus = component.schemata[1].data[0]['children'][0];
      expect(childOfAllosaurus).toBe(chicken);
    });
  });
  describe('updateParents', () => {
    it('should set parents to selected if their only child is selected', () => {
      component.schemata = [
        getChickenSchema(),
        {
          typeName: 'dinosaurs',
          typeLabel: 'Dinosaurs',
          valueField: 'id',
          labelField: 'name',
          childTypeName: 'chickens',
          data: [
            ({
              id: 5,
              name: 'Allosaurus',
              children: [({ chickenId: 3, bwaack: 'bwock?' } as unknown) as { selected?: boolean }],
            } as unknown) as { selected?: boolean },
          ],
        },
      ];
      component.createChildrenReferences();
      component.schemata[0].data[0].selected = true;

      const parent = component.schemata[1].data[0];
      expect(parent.selected).toEqual(undefined);

      component.updateParents();

      expect(parent.selected).toEqual(true);
    });
    it('should set parents to unselected if none of their children are selected', () => {
      component.schemata = [
        getChickenSchema(),
        {
          typeName: 'dinosaurs',
          typeLabel: 'Dinosaurs',
          valueField: 'id',
          labelField: 'name',
          childTypeName: 'chickens',
          data: [
            ({
              selected: true,
              id: 5,
              name: 'Allosaurus',
              children: [...getChickenSchema().data],
            } as unknown) as { selected?: boolean },
          ],
        },
      ];
      component.createChildrenReferences();
      const parent = component.schemata[1].data[0];
      expect(parent.selected).toEqual(true);

      component.updateParents();

      expect(parent.selected).toEqual(undefined);
    });
    it('should set parents to indeterminate if one of their many children is selected', () => {
      const dinosaurSchema = {
        typeName: 'dinosaurs',
        typeLabel: 'Dinosaurs',
        valueField: 'id',
        labelField: 'name',
        childTypeName: 'chickens',
        data: [
          ({
            selected: true,
            id: 5,
            name: 'Allosaurus',
            children: [...getChickenSchema().data],
          } as unknown) as { selected?: boolean; indeterminate?: boolean },
        ],
      };
      component.schemata = [
        {
          ...getChickenSchema(),
          data: [...getChickenSchema().data],
        },
        dinosaurSchema,
      ];
      component.schemata[0].data[0].selected = true;
      component.createChildrenReferences();
      const parent = dinosaurSchema.data[0];
      expect(parent.selected).toEqual(true);

      component.updateParents();

      expect(parent.selected).toEqual(undefined);
      expect(parent.indeterminate).toEqual(true);
    });
  });
  describe('getSelectedValue', () => {
    it('should return indeterminate if one value is selected', () => {
      const childArray = [{ id: 1, name: 'Scout', selected: true }, { id: 2, name: 'Atticus' }];
      const result = component.getSelectedValue(childArray);
      expect(result).toEqual(['indeterminate', true]);
    });
    it('should return selected if every element of the child array is selected', () => {
      const childArray = [{ id: 1, name: 'Scout', selected: true }, { id: 2, name: 'Atticus', selected: true }];
      const result = component.getSelectedValue(childArray);
      expect(result).toEqual(['selected', true]);
    });
    it('should return undefined if none of the items in the child array are selected', () => {
      const childArray = [{ id: 1, name: 'Scout' }, { id: 2, name: 'Atticus' }];
      const result = component.getSelectedValue(childArray as any);
      expect(result).toEqual([]);
    });
  });
  describe('function: onDataListItemClicked', () => {
    it('should work for large datasets', () => {
      const amountOfTimeInMillisecondsThatIndicatesAGrosslyInefficientAlgorithm = 4000;
      const children: TabbedGroupPickerSchema['data'] = Array(10000)
        .fill(0)
        .map((n, i) => ({
          value: i,
          label: `child #${i}`,
          selected: Boolean(i % 2),
        }));
      const childSchema: TabbedGroupPickerSchema = {
        typeLabel: 'child',
        typeName: 'child',
        valueField: 'value',
        labelField: 'label',
        data: children,
      };
      const parentSchemata: TabbedGroupPickerSchema[] = Array(100)
        .fill(0)
        .map(
          (n, i): TabbedGroupPickerSchema => ({
            typeLabel: 'parent',
            typeName: `parent${i}`,
            labelField: `label${i}`,
            valueField: `value${i}`,
            childTypeName: 'child',
            data: Array(100)
              .fill(0)
              .map((nn, ii) => ({
                [`value${i}`]: i,
                [`label${i}`]: i,
                children,
              })),
          }),
        );
      component.schemata = [...parentSchemata, childSchema];
      const firstParent = parentSchemata[0].data[0];
      firstParent.selected = true;
      const start = performance.now();
      component.onDataListItemClicked(firstParent);
      const end = performance.now();
      expect(end - start).toBeLessThan(amountOfTimeInMillisecondsThatIndicatesAGrosslyInefficientAlgorithm);
      const allAreSelected = component.schemata.every((schema) => schema.data.every((datum) => datum.selected));
      expect(allAreSelected).toBe(true);
    });
    it('should select each item in the quick select group', () => {
      const data = [{ id: 1, name: 'chicken', selected: false }, { id: 2, name: 'goldfish', selected: false }];
      const quickSelectItem: TabbedGroupPickerQuickSelect = {
        childTypeName: 'animals',
        children: [data[0]],
        label: 'chicken',
        selected: true,
      };
      component.quickSelectConfig = {
        label: 'Quick Select',
        items: [quickSelectItem],
      };
      component.schemata = [{ typeName: 'animals', typeLabel: 'Animalz', valueField: 'id', labelField: 'name', data }];
      const chicken = component.schemata[0].data[0];
      const goldfish = component.schemata[0].data[1];

      expect(chicken.selected).toBeFalsy();
      component.onDataListItemClicked(quickSelectItem as any);
      expect(chicken.selected).toEqual(true);
      expect(goldfish.selected).toEqual(false);
    });
    it('should unselect each item in the quick select group', () => {
      const data = [{ id: 1, name: 'chicken', selected: true }, { id: 2, name: 'goldfish' }];
      const quickSelectItem: TabbedGroupPickerQuickSelect = {
        childTypeName: 'animals',
        children: [data[0]],
        label: 'chicken',
        selected: false,
      };
      component.quickSelectConfig = {
        label: 'Quick Select',
        items: [quickSelectItem],
      };
      component.schemata = [
        {
          typeName: 'animals',
          typeLabel: 'Animalz',
          valueField: 'id',
          labelField: 'name',
          data,
        },
      ];
      const chicken = component.schemata[0].data[0];
      expect(chicken.selected).toEqual(true);

      component.onDataListItemClicked(quickSelectItem as any);

      expect(chicken.selected).toEqual(undefined);
    });
  });
  describe('function: updateParents', () => {
    it('should select each item in the quick select group', () => {
      const data = [{ id: 1, name: 'chicken', selected: true }, { id: 2, name: 'goldfish' }];
      const quickSelectItem: TabbedGroupPickerQuickSelect = { childTypeName: 'animals', children: [1], label: 'chicken' };
      component.quickSelectConfig = {
        label: 'Quick Select',
        items: [quickSelectItem],
      };
      component.schemata = [
        {
          typeName: 'animals',
          typeLabel: 'Animalz',
          valueField: 'id',
          labelField: 'name',
          data,
        },
      ];
      component.createChildrenReferences();
      expect(quickSelectItem.selected).toEqual(undefined);
      component.updateParents();
      expect(quickSelectItem.selected).toEqual(true);
    });
  });
  describe('onDataListItemClicked', () => {
    it('should update the selected status on the schema as well as the display data', () => {
      component.schemata = [getChickenSchema()];
      const chicken = component.schemata[0].data[0];
      chicken.selected = true;
      component.filter('');
      component.onDataListItemClicked(chicken);
      const selectedItem = component.schemata[0].data[0];
      const displayReference = component.displaySchemata.find(({ typeName }) => typeName === 'chickens').data[0];
      expect(selectedItem.selected).toEqual(true);
      expect(displayReference.selected).toEqual(true);
      expect(selectedItem).toEqual(displayReference);
    });
    it('should update the selected status of a group to indeterminate if an item in the group is selected but others are not', () => {
      const dinosaurs = [
        {
          id: 5,
          name: 'Allosaurus',
          children: [{ chickenId: 3, bwaack: 'bwock?' }, { chickenId: 4, bwaack: 'tweeet' }],
        },
      ];
      component.schemata = [
        getChickenSchema(),
        {
          typeName: 'dinosaurs',
          typeLabel: 'Dinosaurs',
          valueField: 'id',
          labelField: 'name',
          childTypeName: 'chickens',
          data: dinosaurs,
        },
      ];
      const chicken = component.schemata[0].data[0];
      chicken.selected = true;
      component.createChildrenReferences();
      component.onDataListItemClicked(chicken);

      const selectedItem = component.schemata[0].data[0];
      expect(selectedItem.selected).toEqual(true);

      const indeterminateGroup = component.schemata[1].data[0];
      expect(indeterminateGroup.selected).toBeFalsy();
      expect(indeterminateGroup['indeterminate']).toEqual(true);
    });
    it('should update the selected status of a group if the only item in the group is selected', () => {
      const chickenSchema = getChickenSchema();
      const dinosaur = { id: '1', name: 'Tyrannosaurus', children: [chickenSchema.data[0]] };
      component.schemata = [
        chickenSchema,
        {
          typeName: 'dinosaurs',
          typeLabel: 'Dinosaurs',
          valueField: 'id',
          labelField: 'name',
          childTypeName: 'chickens',
          data: [dinosaur],
        },
      ];
      const chicken = component.schemata[0].data[0];
      chicken.selected = true;
      const tRex = component.schemata[1].data[0];

      component.onDataListItemClicked(chicken);
      expect(tRex.selected).toEqual(true);
    });
  });
});
