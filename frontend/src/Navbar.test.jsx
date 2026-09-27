import "@testing-library/jest-dom/vitest";

import {
  render,
  screen,
  fireEvent,
  cleanup,
} from "@testing-library/react";

import { describe, test, expect, afterEach, vi } from "vitest";

import { MemoryRouter } from "react-router-dom";

import Navbar from "./Navbar";


vi.mock("./NotificationBell", () => ({
  default: () => <div>Notifications</div>,
}));


afterEach(() => {
  cleanup();
});


describe("Navbar", () => {

  test("should show farmer navigation links", () => {

    const farmer = {
      name: "Test Farmer",
      role: "farmer",
    };

    render(
      <MemoryRouter>
        <Navbar
          user={farmer}
          onLogout={() => {}}
        />
      </MemoryRouter>
    );


    expect(
      screen.getByText("AgriConnect")
    ).toBeInTheDocument();


    expect(
      screen.getByText("List a Crop")
    ).toBeInTheDocument();


    expect(
      screen.getByText("My Farm Orders")
    ).toBeInTheDocument();


    expect(
      screen.getByText(/Disease Detection/i)
    ).toBeInTheDocument();


    expect(
      screen.getByText(/Bulk Requests/i)
    ).toBeInTheDocument();


    // Emoji ki wajah se regex use kar rahe hain
    expect(
      screen.getByText(/Mandi/i)
    ).toBeInTheDocument();


    expect(
      screen.getByText("Messages")
    ).toBeInTheDocument();


    expect(
      screen.getByText("Test Farmer")
    ).toBeInTheDocument();


    expect(
      screen.getByRole("button", {
        name: "Logout",
      })
    ).toBeInTheDocument();

  });


  test("should call logout when Logout button is clicked", () => {

    const onLogout = vi.fn();

    const farmer = {
      name: "Test Farmer",
      role: "farmer",
    };


    render(
      <MemoryRouter>
        <Navbar
          user={farmer}
          onLogout={onLogout}
        />
      </MemoryRouter>
    );


    fireEvent.click(
      screen.getByRole("button", {
        name: "Logout",
      })
    );


    expect(onLogout).toHaveBeenCalledTimes(1);

  });

});