import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigfilterUriComponent } from './configfilter-uri.component';

describe('ConfigfilterUriComponent', () => {
  let component: ConfigfilterUriComponent;
  let fixture: ComponentFixture<ConfigfilterUriComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ConfigfilterUriComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigfilterUriComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
