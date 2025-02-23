import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';
import { Cacheable } from "ts-cacheable"
import { ApiResponse } from '../model/api-response.model';

// const cacheBuster$ = new Subject<void>();

@Injectable({
  providedIn: 'root'
})
export abstract class ApiService {
  abstract get endpoint(): string;

  constructor(protected http: HttpClient) { }

  private _refreshDataList$ = new Subject<void>();

  private _refreshData$ = new Subject<void>();

  get refreshDataList$() {
    return this._refreshDataList$;
  }

  get refreshData$() {
    return this._refreshData$;
  }
 
  // @Cacheable({ cacheBusterObserver: cacheBuster$ })
  getPaginated(page: number, pageSize: number, search: string): Observable<ApiResponse> {
    let params = new HttpParams()
    .set("page", page.toString())
    .set("page_size", pageSize.toString())
    .set("search", search)
    return this.http.get<ApiResponse>(`${this.endpoint}/all/paginate`, { params });
  }

  // @Cacheable({ cacheBusterObserver: cacheBuster$ })
  getPaginatedById(id: number, page: number, pageSize: number, search: string): Observable<any> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("page_size", pageSize.toString())
      .set("search", search)
    return this.http.get<any>(`${this.endpoint}/all/paginate/${id}`, { params });
  }

  getPaginatedByProvinceId(province_id: number, page: number, pageSize: number, search: string): Observable<any> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("page_size", pageSize.toString())
      .set("search", search)
    return this.http.get<any>(`${this.endpoint}/all/paginate/province/${province_id}`, { params });
  }

  getPaginatedBySupId(sup_id: number, page: number, pageSize: number, search: string): Observable<any> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("page_size", pageSize.toString())
      .set("search", search)
    return this.http.get<any>(`${this.endpoint}/all/paginate/sup/${sup_id}`, { params });
  }

  GetAllBySearch(search: string): Observable<any> {
    let params = new HttpParams() 
      .set("search", search)
    return this.http.get<any>(`${this.endpoint}/all/search/${search}`, { params });
  }

  getData(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.endpoint}/all`);
  }

  // @Cacheable({ cacheBusterObserver: cacheBuster$ })
  getAll(): Observable<any> {
    return this.http.get(`${this.endpoint}/all`);
  }

  getAllById(id: number): Observable<any> {
    return this.http.get(`${this.endpoint}/all/${id}`);
  }

  // @Cacheable({ cacheBusterObserver: cacheBuster$ })
  all(page?: number): Observable<any> {
    let url = `${this.endpoint}`;
    if (page) { // page is optional
      url += `?page=${page}`;
    }
    return this.http.get(url);
  }

  get(id: number): Observable<any> {
    return this.http.get(`${this.endpoint}/get/${id}`);
  }


  create(data: any): Observable<any> {
    return this.http.post(`${this.endpoint}/create`, data).pipe(tap(() => {
      this._refreshDataList$.next();
      this._refreshData$.next();
      // cacheBuster$.next();
    }));
  }

  update(id: number, data: any): Observable<any> {
    return this.http.put(`${this.endpoint}/update/${id}`, data).pipe(tap(() => {
      this._refreshDataList$.next();
      this._refreshData$.next();
      // cacheBuster$.next();
    }));
  }


  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/delete/${id}`).pipe(tap(() => {
      this._refreshDataList$.next();
      this._refreshData$.next();
      // cacheBuster$.next();
    }));
  }

  // Get file
  getFile(url: string): Observable<any> {
    return this.http.get(`${this.endpoint}/${url}`);
  }

  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.endpoint}/uploads`, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }
}