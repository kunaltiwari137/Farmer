import "@testing-library/jest-dom/vitest";

import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";

import { describe, test, expect, afterEach, vi } from "vitest";

import { MemoryRouter } from "react-router-dom";

import CropList from "./CropList";


vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));


vi.mock("./LoadingTruck", () => ({
  default: () => <div>Loading...</div>,
}));


vi.mock("./StarRating", () => ({
  default: () => <div>Rating</div>,
}));


vi.mock("./TiltCard", () => ({
  default: ({ children }) => <div>{children}</div>,
}));


import axios from "axios";


const crops = [
  {
    _id: "crop1",
    crop_name: "Tomato",
    farmer_id: "farmer1",
    price: 40,
    quantity: 50,
    organic: true,
    createdAt: "2026-09-20T10:00:00Z",
    image_url: "",
  },
  {
    _id: "crop2",
    crop_name: "Rice",
    farmer_id: "farmer2",
    price: 60,
    quantity: 100,
    organic: false,
    createdAt: "2026-09-21T10:00:00Z",
    image_url: "",
  },
];


afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
});


describe("CropList", () => {

  test("should display crops from API", async () => {

    axios.get.mockResolvedValue({
      data: crops,
    });


    render(
      <MemoryRouter>
        <CropList />
      </MemoryRouter>
    );


    await waitFor(() => {
      expect(
        screen.getByText("Tomato")
      ).toBeInTheDocument();

      expect(
        screen.getByText("Rice")
      ).toBeInTheDocument();
    });


    expect(
      screen.getByText("Available Crops")
    ).toBeInTheDocument();

  });


  test("should filter crops using search", async () => {

    axios.get.mockResolvedValue({
      data: crops,
    });


    render(
      <MemoryRouter>
        <CropList />
      </MemoryRouter>
    );


    await waitFor(() => {
      expect(
        screen.getByText("Tomato")
      ).toBeInTheDocument();

      expect(
        screen.getByText("Rice")
      ).toBeInTheDocument();
    });


    const searchInput = screen.getByPlaceholderText(
      "e.g. Rice, Tomato..."
    );


    fireEvent.change(searchInput, {
      target: {
        value: "Tomato",
      },
    });


    expect(
      screen.getByText("Tomato")
    ).toBeInTheDocument();


    expect(
      screen.queryByText("Rice")
    ).not.toBeInTheDocument();

  });

});