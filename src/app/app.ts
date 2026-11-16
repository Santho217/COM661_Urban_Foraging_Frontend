
import {
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import { HttpClient } from '@angular/common/http';

// Structure of a foraging spot from our Flask API
interface ForagingSpot {
  spot_id: string;
  title: string;
  plant_species: string;
  category: string;
  hazard_rating: string;
}

// Structure of the API response
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

  // Database records
  spots = signal<ForagingSpot[]>([]);

  // Loading and error states
  loading = signal(true);
  error = signal('');

  // Search and filter values
  searchTerm = signal('');
  selectedCategory = signal('All');

  // Categories taken from the loaded database records
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

  // Search and filter the foraging spots
  filteredSpots = computed(() => {

    const search = this.searchTerm()
      .trim()
      .toLowerCase();

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

  // Update the search text
  updateSearch(value: string): void {
    this.searchTerm.set(value);
  }

  // Update the selected category
  updateCategory(value: string): void {
    this.selectedCategory.set(value);
  }

  // Clear search and filters
  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedCategory.set('All');
  }

  // Retrieve records from Flask and MongoDB
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
