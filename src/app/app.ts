
import {
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import { HttpClient } from '@angular/common/http';

interface ForagingSpot {
  spot_id: string;
  title: string;
  plant_species: string;
  category: string;
  hazard_rating: string;
}

interface ForagingSpotDetail extends ForagingSpot {
  [key: string]: unknown;
}

interface SpotsResponse {
  count: number;
  data_status: string;
  spots: ForagingSpot[];
}

// The Flask API wraps the full plant record in "spot".
interface SpotDetailResponse {
  data_status: string;
  spot: ForagingSpotDetail;
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

  searchTerm = signal('');
  selectedCategory = signal('All');

  selectedSpot = signal<ForagingSpotDetail | null>(null);
  detailLoading = signal(false);
  detailError = signal('');

  selectedSpotJson = computed(() => {
    const spot = this.selectedSpot();
    return spot ? JSON.stringify(spot, null, 2) : '';
  });

  categories = computed(() => {
    const uniqueCategories = [
      ...new Set(
        this.spots()
          .map(spot => spot.category)
          .filter(Boolean)
      )
    ];

    return ['All', ...uniqueCategories.sort()];
  });

  filteredSpots = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const category = this.selectedCategory();

    return this.spots().filter(spot => {

      const matchesSearch =
        !search ||
        spot.title.toLowerCase().includes(search) ||
        spot.plant_species.toLowerCase().includes(search) ||
        spot.category.toLowerCase().includes(search) ||
        spot.spot_id.toLowerCase().includes(search);

      const matchesCategory =
        category === 'All' ||
        spot.category === category;

      return matchesSearch && matchesCategory;
    });
  });

  updateSearch(value: string): void {
    this.searchTerm.set(value);
  }

  updateCategory(value: string): void {
    this.selectedCategory.set(value);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedCategory.set('All');
  }

  // Load full details for one plant
  openSpotDetails(spot: ForagingSpot): void {

    this.selectedSpot.set(null);
    this.detailError.set('');
    this.detailLoading.set(true);

    const spotId = encodeURIComponent(spot.spot_id);

    this.http.get<SpotDetailResponse>(
      `/spots/${spotId}`
    ).subscribe({

      next: (response) => {
        // Read the record inside the API's "spot" field
        if (response.spot) {
          this.selectedSpot.set(response.spot);
        } else {
          this.detailError.set('Plant details were not found.');
        }

        this.detailLoading.set(false);
      },

      error: () => {
        this.detailError.set(
          'Unable to load plant details. Please try again.'
        );
        this.detailLoading.set(false);
      }
    });
  }

  closeSpotDetails(): void {
    this.selectedSpot.set(null);
    this.detailError.set('');
    this.detailLoading.set(false);
  }

  // Load the list of foraging spots
  ngOnInit(): void {

    this.http.get<SpotsResponse>('/spots').subscribe({

      next: (response) => {
        this.spots.set(response.spots);
        this.error.set('');
        this.loading.set(false);
      },

      error: () => {
        this.error.set(
          'Unable to load foraging spots. Check that the Flask API is running.'
        );
        this.loading.set(false);
      }
    });
  }
}
