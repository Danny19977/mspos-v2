import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { GeolocationService } from '@ng-web-apis/geolocation';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { MatSort, Sort } from '@angular/material/sort';
import { routes } from '../../../shared/routes/routes';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { UserModel } from '../../../auth/models/user.model';
import { AuthService } from '../../../auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { IProvince } from '../../province/models/province.model';
import { IPosForm } from '../models/posform.models';
import { PosformService } from '../posform.service';
import { IUser } from '../../user/models/user.model';
import { IArea } from '../../areas/models/area.model';
import { ISup } from '../../sups/models/sup.model';
import { IPos } from '../../pos-vente/models/pos.model';
import { generateRandomString } from '../../../utils/generate-random';
import { PosVenteService } from '../../pos-vente/pos-vente.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { LogsService } from '../../user-logs/logs.service';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { map, Observable, startWith, switchMap } from 'rxjs';


@Component({
  selector: 'app-postform-list',
  templateUrl: './postform-list.component.html',
  styleUrl: './postform-list.component.scss'
})
export class PostformListComponent implements OnInit {
  isLoadingData = false;
  public routes = routes;
  // Table 
  dataList: IPosForm[] = [];
  totalItems: number = 0;
  pageSize: number = 15;
  pageIndex: number = 0;
  length: number = 0;

  // Table 
  displayedColumns: string[] = ['created_at', 'eq', 'sold', 'dhl', 'ar', 'sbl', 'pmf', 'pmm', 'ticket', 'mtc', 'ws', 'mast', 'oris', 'elite', 'yes', 'time', 'province_id', 'area_id', 'sup_id', 'pos_id', 'user_id', 'comment', 'id'];
  dataSource = new MatTableDataSource<IPosForm>(this.dataList);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  public search = '';

  posFilter = '';

  // Forms  
  idItem!: number;
  dataItem!: IPosForm; // Single data 


  formGroup!: FormGroup;
  currentUser!: UserModel;
  isLoading = false;

  latitude!: number;
  longitude!: number;


  userList: IUser[] = [];
  provinceList: IProvince[] = [];
  areaList: IArea[] = [];
  supList: ISup[] = [];
  posList: IPos[] = [];
  posListFilter: IPos[] = [];
 
  filteredOptions: IPos[] = []

  priceList: string[] = ['150', '100']

  @ViewChild('pos_id') pos_id!: ElementRef<HTMLInputElement>;
  isload = false;

  constructor(
    private readonly geolocation$: GeolocationService,
    private router: Router,
    private _formBuilder: FormBuilder,
    private authService: AuthService,
    public posformService: PosformService,
    private posService: PosVenteService,
    private logActivity: LogsService,
    private toastr: ToastrService
  ) { 
  }

  selectedValue1: any[] | undefined;
  selectedValue2: any[] | undefined;
  selectedValue3: any[] | undefined;
  selectedValue4: any[] | undefined;

  selectedDatas1: any[] | undefined;
  selectedDatas2: any[] | undefined;
  selectedDatas3: any[] | undefined;
  selectedDatas4: any[] | undefined;




  ngAfterViewInit(): void {
    this.authService.user().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.posformService.refreshDataList$.subscribe(() => {
          this.fetchProducts(this.currentUser);
        });
        this.fetchProducts(this.currentUser);

        this.getAllPos(this.currentUser);

        this.geolocation$.subscribe((position) => {
          this.latitude = position.coords.latitude;
          this.longitude = position.coords.longitude;
          // console.log('Latitude:', position.coords.latitude);
          // console.log('Longitude:', position.coords.longitude);
        });
      },
      error: (error) => {
        this.isLoadingData = false;
        this.router.navigate(['/auth/login']);
        console.log(error);
      }
    });
  }


  ngOnInit() {
    this.isLoadingData = true;

    this.formGroup = this._formBuilder.group({
      pos_id: new FormControl(null, Validators.required),
      eq: ['', Validators.required],
      sold: ['', Validators.required],
      dhl: ['', Validators.required],
      ar: ['', Validators.required],
      sbl: ['', Validators.required],
      pmf: ['', Validators.required],
      pmm: ['', Validators.required],
      ticket: ['', Validators.required],
      mtc: ['', Validators.required],
      ws: ['', Validators.required],
      mast: ['', Validators.required],
      oris: ['', Validators.required],
      elite: ['', Validators.required],
      yes: ['', Validators.required],
      time: ['', Validators.required],
      comment: ['Rien à signaler', Validators.required],
      price: ['', Validators.required],
    });

  } 

  getAllPos(currentUser: UserModel): void {
    this.isload = true;
    const filterValue = this.pos_id.nativeElement.value.toLowerCase();

    this.posService.getAll().subscribe(res => {
      this.posList = res.data;
      if (currentUser.role == 'DR') {
        this.posListFilter = this.posList.filter((v) => v.user_id == this.currentUser.id);
      } else {
        this.posListFilter = this.posList;
      }
      this.filteredOptions = this.posListFilter.filter(o => o.name.toLowerCase().includes(filterValue)); 
 
      this.isload = false;
     
    });
  } 
  
  displayFn(pos: any): any {
    return pos && pos.name ? pos.name : '';
  }

  optionSelected(event: MatAutocompleteSelectedEvent) {
    const selectedOption = event.option.value;
    const pos_id = selectedOption.ID;
    const name = selectedOption.name;

    // Utilisez id et fullName comme vous le souhaitez
    console.log('pos_id:', pos_id);
    console.log('Name:', name);
  }

  onPageChange(event: PageEvent): void {
    this.isLoadingData = true;
    this.pageIndex = event.pageIndex
    this.pageSize = event.pageSize
    this.fetchProducts(this.currentUser);
  }

  fetchProducts(currentUser: UserModel) {

    if (currentUser.role == 'Manager') {
      this.posformService.getPaginated(this.pageIndex, this.pageSize, this.search).subscribe(res => {
        this.dataList = res.data;
        this.totalItems = res.pagination.total_pages;
        this.length = res.pagination.length;
        this.dataSource = new MatTableDataSource<IPosForm>(this.dataList);
        this.dataSource.sort = this.sort;

        this.isLoadingData = false;
      });
    } else if (currentUser.role == 'ASM') {
      this.posformService.getPaginatedByProvinceId(currentUser.province_id, this.pageIndex, this.pageSize, this.search).subscribe(res => {
        this.dataList = res.data;

        this.totalItems = res.pagination.total_pages;
        this.length = res.pagination.length;
        this.dataSource = new MatTableDataSource<IPosForm>(this.dataList);
        this.dataSource.sort = this.sort;

        this.isLoadingData = false;
      });
    } else if (currentUser.role == 'Supervisor') {
      this.posformService.getPaginatedBySupId(currentUser.sup_id, this.pageIndex, this.pageSize, this.search).subscribe(res => {
        this.dataList = res.data;
        this.totalItems = res.pagination.total_pages;
        this.length = res.pagination.length;
        this.dataSource = new MatTableDataSource<IPosForm>(this.dataList);
        this.dataSource.sort = this.sort;

        this.isLoadingData = false;
      });
    } else if (currentUser.role == 'DR') {
      this.posformService.getPaginatedById(currentUser.id, this.pageIndex, this.pageSize, this.search).subscribe(res => {
        this.dataList = res.data;
        this.totalItems = res.pagination.total_pages;
        this.length = res.pagination.length;
        this.dataSource = new MatTableDataSource<IPosForm>(this.dataList);
        this.dataSource.sort = this.sort;

        this.isLoadingData = false;
      });
    } else {
      this.posformService.getPaginated(this.pageIndex, this.pageSize, this.search).subscribe(res => {
        this.dataList = res.data;
        this.totalItems = res.pagination.total_pages;
        this.length = res.pagination.length;
        this.dataSource = new MatTableDataSource<IPosForm>(this.dataList);
        this.dataSource.sort = this.sort;

        console.log("dataList", this.dataList);

        this.isLoadingData = false;
      });
    }

  }

  onSearchChange(search: string) {
    this.search = search;
    this.fetchProducts(this.currentUser);
  }


  public sortData(sort: Sort) {
    const data = this.dataList.slice();
    if (!sort.active || sort.direction === '') {
      this.dataList = data;
    } else {
      this.dataList = data.sort((a, b) => {
        const aValue = (a as never)[sort.active];
        const bValue = (b as never)[sort.active];
        return (aValue < bValue ? -1 : 1) * (sort.direction === 'asc' ? 1 : -1);
      });
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  public sidebarPopup = false;
  public sidebarPopup2 = false;
  openSidebarPopup() {
    this.sidebarPopup = !this.sidebarPopup;
  }
  openSidebarPopup2() {
    this.sidebarPopup2 = !this.sidebarPopup2;
  }

  onSubmit() {
    try {
      if (this.formGroup.valid) {
        this.isLoading = true;
        var body = {
          id_unique: generateRandomString(6),
          eq: parseInt(this.formGroup.value.eq),
          eq1: (parseInt(this.formGroup.value.eq) > 0 ? 1 : 0),
          sold: parseInt(this.formGroup.value.sold),
          dhl: parseInt(this.formGroup.value.dhl),
          dhl1: (parseInt(this.formGroup.value.dhl) > 0 ? 1 : 0),
          ar: parseInt(this.formGroup.value.ar),
          ar1: (parseInt(this.formGroup.value.ar) > 0 ? 1 : 0),
          sbl: parseInt(this.formGroup.value.sbl),
          sbl1: (parseInt(this.formGroup.value.sbl) > 0 ? 1 : 0),
          pmf: parseInt(this.formGroup.value.pmf),
          pmf1: (parseInt(this.formGroup.value.pmf) > 0 ? 1 : 0),
          pmm: parseInt(this.formGroup.value.pmm),
          pmm1: (parseInt(this.formGroup.value.pmm) > 0 ? 1 : 0),
          ticket: parseInt(this.formGroup.value.ticket),
          ticket1: (parseInt(this.formGroup.value.ticket) > 0 ? 1 : 0),
          mtc: parseInt(this.formGroup.value.mtc),
          mtc1: (parseInt(this.formGroup.value.mtc) > 0 ? 1 : 0),
          ws: parseInt(this.formGroup.value.ws),
          ws1: (parseInt(this.formGroup.value.ws) > 0 ? 1 : 0),
          mast: parseInt(this.formGroup.value.mast),
          mast1: (parseInt(this.formGroup.value.mast) > 0 ? 1 : 0),
          oris: parseInt(this.formGroup.value.oris),
          oris1: (parseInt(this.formGroup.value.oris) > 0 ? 1 : 0),
          elite: parseInt(this.formGroup.value.elite),
          elite1: (parseInt(this.formGroup.value.elite) > 0 ? 1 : 0),
          yes: parseInt(this.formGroup.value.yes),
          yes1: (parseInt(this.formGroup.value.yes) > 0 ? 1 : 0),
          time: parseInt(this.formGroup.value.time),
          time1: (parseInt(this.formGroup.value.time) > 0 ? 1 : 0),
          comment: this.formGroup.value.comment,
          user_id: this.currentUser.id,
          province_id: this.currentUser.province_id,
          area_id: this.currentUser.area_id,
          sup_id: this.currentUser.sup_id,
          pos_id: parseInt(this.formGroup.value.pos_id.ID),
          latitude: this.latitude.toString(),
          longitude: this.longitude.toString(),
          price: this.formGroup.value.price,
          signature: this.currentUser.fullname,
        };
        this.posformService.create(body).subscribe({
          next: (res) => {
            this.logActivity.activity(
              'PosForm',
              this.currentUser.id,
              'created',
              `Created new PosForm id: ${res.data.ID}`,
              this.currentUser.fullname
            ).subscribe({
              next: () => {
                this.isLoading = false;
                this.formGroup.reset();
                this.toastr.success('Fiche soumise avec succès!', 'Success!');
              },
              error: (err) => {
                this.isLoading = false;
                this.toastr.error(`${err.error.message}`, 'Oupss!');
                console.log(err);
              }
            });
          },
          error: (err) => {
            this.isLoading = false;
            this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
            console.log(err);
          }
        });
      }
    } catch (error) {
      this.isLoading = false;
      console.log(error);
    }
  }

  onSubmitUpdate() {
    try {
      this.isLoading = true;
      var body = {
        eq: parseInt(this.formGroup.value.eq),
        eq1: (parseInt(this.formGroup.value.eq) > 0 ? 1 : 0),
        sold: parseInt(this.formGroup.value.sold),
        dhl: parseInt(this.formGroup.value.dhl),
        dhl1: (parseInt(this.formGroup.value.dhl) > 0 ? 1 : 0),
        ar: parseInt(this.formGroup.value.ar),
        ar1: (parseInt(this.formGroup.value.ar) > 0 ? 1 : 0),
        sbl: parseInt(this.formGroup.value.sbl),
        sbl1: (parseInt(this.formGroup.value.sbl) > 0 ? 1 : 0),
        pmf: parseInt(this.formGroup.value.pmf),
        pmf1: (parseInt(this.formGroup.value.pmf) > 0 ? 1 : 0),
        pmm: parseInt(this.formGroup.value.pmm),
        pmm1: (parseInt(this.formGroup.value.pmm) > 0 ? 1 : 0),
        ticket: parseInt(this.formGroup.value.ticket),
        ticket1: (parseInt(this.formGroup.value.ticket) > 0 ? 1 : 0),
        mtc: parseInt(this.formGroup.value.mtc),
        mtc1: (parseInt(this.formGroup.value.mtc) > 0 ? 1 : 0),
        ws: parseInt(this.formGroup.value.ws),
        ws1: (parseInt(this.formGroup.value.ws) > 0 ? 1 : 0),
        mast: parseInt(this.formGroup.value.mast),
        mast1: (parseInt(this.formGroup.value.mast) > 0 ? 1 : 0),
        oris: parseInt(this.formGroup.value.oris),
        oris1: (parseInt(this.formGroup.value.oris) > 0 ? 1 : 0),
        elite: parseInt(this.formGroup.value.elite),
        elite1: (parseInt(this.formGroup.value.elite) > 0 ? 1 : 0),
        yes: parseInt(this.formGroup.value.yes),
        yes1: (parseInt(this.formGroup.value.yes) > 0 ? 1 : 0),
        time: parseInt(this.formGroup.value.time),
        time1: (parseInt(this.formGroup.value.time) > 0 ? 1 : 0),
        comment: this.formGroup.value.comment,
        user_id: this.currentUser.id,
        province_id: this.currentUser.province_id,
        area_id: this.currentUser.area_id,
        sup_id: this.currentUser.sup_id,
        pos_id: parseInt(this.formGroup.value.pos_id),
        latitude: this.latitude,
        longitude: this.longitude,
        price: this.formGroup.value.price,
        signature: this.currentUser.fullname,
      };
      this.posformService.update(this.idItem, body)
        .subscribe({
          next: (res) => {
            this.logActivity.activity(
              'PosForm',
              this.currentUser.id,
              'updated',
              `Updated Posform id: ${res.data.ID}`,
              this.currentUser.fullname
            ).subscribe({
              next: () => {
                this.formGroup.reset();
                this.toastr.success('Modification enregistré!', 'Success!');
                this.isLoading = false;
              },
              error: (err) => {
                this.isLoading = false;
                this.toastr.error(`${err.error.message}`, 'Oupss!');
                console.log(err);
              }
            });
          },
          error: err => {
            console.log(err);
            this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
            this.isLoading = false;
          }
        });
    } catch (error) {
      this.isLoading = false;
      console.log(error);
    }
  }

  findValue(value: number) {
    this.idItem = value;
    this.posformService.get(this.idItem).subscribe(item => {
      this.dataItem = item.data;
      this.formGroup.patchValue({
        // id_unique: this.dataItem.id_unique,  
        pos_id: this.dataItem.pos_id,
        eq: this.dataItem.eq,
        eq1: this.dataItem.eq1,
        sold: this.dataItem.sold,
        dhl: this.dataItem.dhl,
        dhl1: this.dataItem.dhl1,
        ar: this.dataItem.ar,
        ar1: this.dataItem.ar1,
        sbl: this.dataItem.sbl,
        sbl1: this.dataItem.sbl1,
        pmf: this.dataItem.pmf,
        pmf1: this.dataItem.pmf1,
        pmm: this.dataItem.pmm,
        pmm1: this.dataItem.pmm1,
        ticket: this.dataItem.ticket,
        ticket1: this.dataItem.ticket1,
        mtc: this.dataItem.mtc,
        mtc1: this.dataItem.mtc1,
        ws: this.dataItem.ws,
        ws1: this.dataItem.ws1,
        mast: this.dataItem.mast,
        mast1: this.dataItem.mast1,
        oris: this.dataItem.oris,
        oris1: this.dataItem.oris1,
        elite: this.dataItem.elite,
        elite1: this.dataItem.elite1,
        yes: this.dataItem.yes,
        yes1: this.dataItem.yes1,
        time: this.dataItem.time,
        time1: this.dataItem.time1,
        comment: this.dataItem.comment,
        latitude: this.dataItem.latitude,
        longitude: this.dataItem.longitude,
        price: this.dataItem.comment,
      });
    }
    );
  }



  delete(): void {
    this.posformService
      .delete(this.idItem)
      .subscribe({
        next: () => {
          this.logActivity.activity(
            'Posform',
            this.currentUser.id,
            'deleted',
            `Delete posform id: ${this.idItem}`,
            this.currentUser.fullname
          ).subscribe({
            next: () => {
              this.formGroup.reset();
              this.toastr.info('Supprimé avec succès!', 'Success!');
              this.isLoading = false;
            },
            error: (err) => {
              this.isLoading = false;
              this.toastr.error(`${err.error.message}`, 'Oupss!');
              console.log(err);
            }
          });
        },
        error: err => {
          this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
          console.log(err);
        }
      }
      );
  }

}
