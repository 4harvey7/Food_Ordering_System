/*
    QUICKBITE - FOOD ORDERING SYSTEM

    Factory Pattern  -> FoodFactory creates food items.
    Singleton Pattern -> CartManager is the single shared cart instance.
    Data is kept in localStorage so the cart survives a page refresh.
*/

// ---------- FACTORY ----------
class FoodFactory {
    static create(id, name, price, category, icon) {
        return { id, name, price, category, icon };
    }
}

const menu = [
    FoodFactory.create(1, "Cheeseburger", 149, "Main", "🍔"),
    FoodFactory.create(2, "Pepperoni Pizza", 249, "Main", "🍕"),
    FoodFactory.create(3, "Fried Chicken", 199, "Main", "🍗"),
    FoodFactory.create(4, "French Fries", 79, "Sides", "🍟"),
    FoodFactory.create(5, "Garden Salad", 99, "Sides", "🥗"),
    FoodFactory.create(6, "Iced Cola", 49, "Drinks", "🥤"),
    FoodFactory.create(7, "Iced Tea", 45, "Drinks", "🧋"),
    FoodFactory.create(8, "Chocolate Cake", 89, "Dessert", "🍰")
];

// ---------- SINGLETON ----------
class CartManager {
    constructor() {
        if (CartManager.instance) return CartManager.instance;
        this.key = "quickBiteCart";
        this.cart = JSON.parse(localStorage.getItem(this.key)) || [];
        CartManager.instance = this;
    }

    add(food) {
        const item = this.cart.find(i => i.id === food.id);
        item ? item.qty++ : this.cart.push({ ...food, qty: 1 });
        this.save();
    }

    changeQty(id, delta) {
        const item = this.cart.find(i => i.id === id);
        if (!item) return;
        item.qty += delta;
        item.qty <= 0 ? this.remove(id) : this.save();
    }

    remove(id) {
        this.cart = this.cart.filter(i => i.id !== id);
        this.save();
    }

    clear() { this.cart = []; this.save(); }
    totalItems() { return this.cart.reduce((n, i) => n + i.qty, 0); }
    totalPrice() { return this.cart.reduce((n, i) => n + i.price * i.qty, 0); }
    save() { localStorage.setItem(this.key, JSON.stringify(this.cart)); }
}

const cart = new CartManager();

// ---------- APP ----------
const menuGrid = document.getElementById("menuGrid");
const cartContent = document.getElementById("cartContent");
const cartCount = document.getElementById("cartCount");
let activeCategory = "all";

const peso = n => "₱" + n.toFixed(2);

function renderMenu() {
    const items = menu.filter(f => activeCategory === "all" || f.category === activeCategory);

    menuGrid.innerHTML = items.map(f => `
        <div class="food-card">
            <div class="food-image">${f.icon}</div>
            <div class="food-info">
                <span class="category">${f.category}</span>
                <h3>${f.name}</h3>
                <div class="price">${peso(f.price)}</div>
                <button class="add-btn" onclick="addFood(${f.id})">Add to Cart</button>
            </div>
        </div>
    `).join("");
}

function addFood(id) {
    const food = menu.find(f => f.id === id);
    cart.add(food);
    cartCount.textContent = cart.totalItems();
    showToast(`${food.name} added to cart.`);
}

function renderCart() {
    if (cart.cart.length === 0) {
        cartContent.innerHTML = `<div class="empty"><h3>Your cart is empty</h3><p>Add something tasty from the menu.</p></div>`;
        return;
    }

    const items = cart.cart.map(i => `
        <div class="cart-item">
            <div class="icon">${i.icon}</div>
            <div class="info">
                <strong>${i.name}</strong>
                <div class="qty-controls">
                    <button class="qty-btn" onclick="updateQty(${i.id}, -1)">−</button>
                    <span>${i.qty}</span>
                    <button class="qty-btn" onclick="updateQty(${i.id}, 1)">+</button>
                    <button class="remove-btn" onclick="removeFood(${i.id})">Remove</button>
                </div>
            </div>
            <strong>${peso(i.price * i.qty)}</strong>
        </div>
    `).join("");

    cartContent.innerHTML = `
        ${items}
        <div class="summary">
            <div class="total-row"><span>Total</span><span>${peso(cart.totalPrice())}</span></div>
            <button class="place-btn" onclick="showCheckout()">Place Order</button>
        </div>
    `;
}

function updateQty(id, delta) {
    cart.changeQty(id, delta);
    cartCount.textContent = cart.totalItems();
    renderCart();
}

function removeFood(id) {
    cart.remove(id);
    cartCount.textContent = cart.totalItems();
    renderCart();
    showToast("Item removed.");
}

function showCheckout() {
    cartContent.innerHTML = `
        <div class="summary">
            <h3 style="margin-bottom:15px;">Delivery Details</h3>
            <div class="form-group">
                <label>Full Name</label>
                <input id="custName" placeholder="Enter your name">
            </div>
            <div class="form-group">
                <label>Delivery Address</label>
                <input id="custAddress" placeholder="Enter your address">
            </div>
            <div class="total-row"><span>Total</span><span>${peso(cart.totalPrice())}</span></div>
            <button class="place-btn" onclick="confirmOrder()">Confirm Order</button>
        </div>
    `;
}

function confirmOrder() {
    const name = document.getElementById("custName").value.trim();
    const address = document.getElementById("custAddress").value.trim();

    if (!name || !address) {
        showToast("Please fill in all fields.");
        return;
    }

    const order = {
        orderNumber: "QB-" + Date.now(),
        name, address,
        items: cart.cart,
        total: cart.totalPrice()
    };
    localStorage.setItem("quickBiteLastOrder", JSON.stringify(order));

    cart.clear();
    cartCount.textContent = 0;

    cartContent.innerHTML = `
        <div class="confirmation">
            <div class="check">✅</div>
            <h2>Order Confirmed!</h2>
            <p>Thanks, ${name}. Your food is being prepared.</p>
            <p><strong>Order #:</strong> ${order.orderNumber}</p>
            <button class="place-btn" style="margin-top:15px;" onclick="showSection('menu')">Back to Menu</button>
        </div>
    `;
}

function showToast(msg) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 1800);
}

function showSection(section) {
    document.getElementById("menuSection").classList.toggle("active-section", section === "menu");
    document.getElementById("cartSection").classList.toggle("active-section", section === "cart");
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.section === section));
    if (section === "cart") renderCart();
}

document.querySelectorAll(".nav-btn").forEach(b =>
    b.addEventListener("click", () => showSection(b.dataset.section))
);

document.querySelectorAll(".filter-btn").forEach(b =>
    b.addEventListener("click", () => {
        activeCategory = b.dataset.cat;
        document.querySelectorAll(".filter-btn").forEach(x => x.classList.remove("active"));
        b.classList.add("active");
        renderMenu();
    })
);

// Initial load
renderMenu();
cartCount.textContent = cart.totalItems();
