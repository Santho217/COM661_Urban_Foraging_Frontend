
import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface ForagingSpot {
  spot_id: string;
  title: string;
  plant_species: string;
  category: string;
  hazard_rating: string;
}

interface SpotsResponse {
  count: number;
  data_status: string;
  spots: ForagingSpot[];
}

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private http = inject(HttpClient);

  spots = signal<ForagingSpot[]>([]);
  loading = signal(true);
  error = signal('');

  ngOnInit(): void {
    this.http.get<SpotsResponse>('/spots').subscribe({
      next: (response) => {
        this.spots.set(response.spots);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load foraging spots.');
        this.loading.set(false);
      }
    });
  }
}
